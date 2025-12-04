import {
  env,
  AutoModel,
  AutoProcessor,
  RawImage,
  PreTrainedModel,
  Processor,
} from "@huggingface/transformers"

// Initialize different model configurations
const WEBGPU_MODEL_ID = "Xenova/modnet"
const FALLBACK_MODEL_ID = "briaai/RMBG-1.4"
const LIVE_IN_SIZE = 32 // canlı matting için hedef giriş (32'nin katı: 256/320/384...)

interface ModelState {
  model: PreTrainedModel | null
  processor: Processor | null // yüksek kalite (foto) için
  liveProcessor: Processor | null // canlı video için küçük giriş
  isWebGPUSupported: boolean
  currentModelId: string
  isIOS: boolean
}

interface ModelInfo {
  currentModelId: string
  isWebGPUSupported: boolean
  isIOS: boolean
}

// iOS detection
const isIOS = () => {
  return (
    [
      "iPad Simulator",
      "iPhone Simulator",
      "iPod Simulator",
      "iPad",
      "iPhone",
      "iPod",
    ].includes(navigator.platform) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  )
}

const state: ModelState = {
  model: null,
  processor: null,
  liveProcessor: null,
  isWebGPUSupported: false,
  currentModelId: FALLBACK_MODEL_ID,
  isIOS: isIOS(),
}

async function initializeWebGPU(): Promise<boolean> {
  try {
    // Check if WebGPU is supported
    if (!(navigator as any).gpu) {
      return false
    }

    // Initialize WebGPU model
    state.model = await AutoModel.from_pretrained(WEBGPU_MODEL_ID)
    state.processor = await AutoProcessor.from_pretrained(WEBGPU_MODEL_ID, {})

    return true
  } catch (error) {
    console.error("WebGPU initialization failed:", error)
    return false
  }
}

export async function initializeModel(forceModelId?: string): Promise<boolean> {
  try {
    // iOS → RMBG-1.4 (WASM/worker)
    if (state.isIOS) {
      env.allowLocalModels = false
      if (env.backends?.onnx?.wasm) {
        env.backends.onnx.wasm.proxy = true
        env.backends.onnx.wasm.simd = true
        env.backends.onnx.wasm.numThreads = Math.min(
          4,
          (navigator as any).hardwareConcurrency || 4
        )
      }

      state.model = await AutoModel.from_pretrained(FALLBACK_MODEL_ID)

      // Foto için yüksek kalite
      state.processor = await AutoProcessor.from_pretrained(FALLBACK_MODEL_ID, {
        config: {
          do_normalize: true,
          do_pad: false,
          do_rescale: true,
          do_resize: true,
          image_mean: [0.5, 0.5, 0.5],
          feature_extractor_type: "ImageFeatureExtractor",
          image_std: [1, 1, 1],
          resample: 2,
          rescale_factor: 0.00392156862745098,
          size: { width: 1024, height: 1024 },
        },
      })

      // Canlı için küçük giriş
      state.liveProcessor = await AutoProcessor.from_pretrained(
        FALLBACK_MODEL_ID,
        {
          config: {
            do_normalize: true,
            do_pad: true,
            do_rescale: true,
            do_resize: true,
            image_mean: [0.5, 0.5, 0.5],
            image_std: [0.5, 0.5, 0.5],
            resample: 2,
            rescale_factor: 0.00392156862745098,
            size: { width: LIVE_IN_SIZE, height: LIVE_IN_SIZE },
          },
        }
      )

      state.currentModelId = FALLBACK_MODEL_ID
      return true
    }

    // ... non-iOS
    const selectedModelId = forceModelId || FALLBACK_MODEL_ID
    if (selectedModelId === WEBGPU_MODEL_ID) {
      const ok = await initializeWebGPU()
      if (ok) {
        state.currentModelId = WEBGPU_MODEL_ID
        return true
      }
    }

    // WASM fallback (RMBG)
    env.allowLocalModels = false
    if (env.backends?.onnx?.wasm) {
      env.backends.onnx.wasm.proxy = true // worker
      env.backends.onnx.wasm.simd = true
      env.backends.onnx.wasm.numThreads = Math.min(
        4,
        (navigator as any).hardwareConcurrency || 4
      )
    }

    state.model = await AutoModel.from_pretrained(FALLBACK_MODEL_ID, {
      progress_callback: (p) =>
        console.log(`Loading model: ${Math.round((p as any).progress * 100)}%`),
    })

    // Foto için 1024
    state.processor = await AutoProcessor.from_pretrained(FALLBACK_MODEL_ID, {
      revision: "main",
      config: {
        do_normalize: true,
        do_pad: true,
        do_rescale: true,
        do_resize: true,
        image_mean: [0.5, 0.5, 0.5],
        feature_extractor_type: "ImageFeatureExtractor",
        image_std: [0.5, 0.5, 0.5],
        resample: 2,
        rescale_factor: 0.00392156862745098,
        size: { width: 1024, height: 1024 },
      },
    })

    // Canlı için 320
    state.liveProcessor = await AutoProcessor.from_pretrained(
      FALLBACK_MODEL_ID,
      {
        config: {
          do_normalize: true,
          do_pad: true,
          do_rescale: true,
          do_resize: true,
          image_mean: [0.5, 0.5, 0.5],
          feature_extractor_type: "ImageFeatureExtractor",
          image_std: [0.5, 0.5, 0.5],
          resample: 2,
          rescale_factor: 0.00392156862745098,
          size: { width: LIVE_IN_SIZE, height: LIVE_IN_SIZE },
        },
      }
    )

    state.currentModelId = FALLBACK_MODEL_ID
    if (!state.model || !state.processor) throw new Error("Init failed")
    return true
  } catch (error) {
    console.error("Error initializing model:", error)
    if (forceModelId === WEBGPU_MODEL_ID) {
      console.log("Falling back to cross-browser model...")
      return initializeModel(FALLBACK_MODEL_ID)
    }
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to initialize background removal model"
    )
  }
}

// Get current model info
export function getModelInfo(): ModelInfo {
  return {
    currentModelId: state.currentModelId,
    isWebGPUSupported: Boolean((navigator as any).gpu),
    isIOS: state.isIOS,
  }
}

export async function processImage(image: File): Promise<File> {
  if (!state.model || !state.processor) {
    throw new Error("Model not initialized. Call initializeModel() first.")
  }

  const img = await RawImage.fromURL(URL.createObjectURL(image))

  try {
    // Pre-process image
    const { pixel_values } = await state.processor(img)

    // Predict alpha matte
    const { output } = await state.model({ input: pixel_values })

    // Resize mask back to original size
    const maskData = (
      await RawImage.fromTensor(output[0].mul(255).to("uint8")).resize(
        img.width,
        img.height
      )
    ).data

    // Create new canvas
    const canvas = document.createElement("canvas")
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Could not get 2d context")

    // Draw original image output to canvas
    ctx.drawImage(img.toCanvas(), 0, 0)

    // Update alpha channel
    const pixelData = ctx.getImageData(0, 0, img.width, img.height)
    for (let i = 0; i < maskData.length; ++i) {
      pixelData.data[4 * i + 3] = maskData[i]
    }
    ctx.putImageData(pixelData, 0, 0)

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Failed to create blob")),
        "image/png"
      )
    )

    const [fileName] = image.name.split(".")
    const processedFile = new File([blob], `${fileName}-bg-blasted.png`, {
      type: "image/png",
    })
    return processedFile
  } catch (error) {
    console.error("Error processing image:", error)
    throw new Error("Failed to process image")
  }
}

export async function processImages(images: File[]): Promise<File[]> {
  console.log("Processing images...")
  const processedFiles: File[] = []

  for (const image of images) {
    try {
      const processedFile = await processImage(image)
      processedFiles.push(processedFile)
      console.log("Successfully processed image", image.name)
    } catch (error) {
      console.error("Error processing image", image.name, error)
    }
  }

  console.log("Processing images done")
  return processedFiles
}

export async function predictMaskFromCanvas(
  srcCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number
): Promise<Uint8ClampedArray> {
  if (!state.model || !state.processor) {
    throw new Error("Model not initialized. Call initializeModel() first.")
  }

  // 1) Küçük ara canvas yerine doğrudan ImageBitmap üret
  let raw: RawImage
  try {
    const bitmap = await createImageBitmap(srcCanvas) // çok hızlı
    // transformers.js: RawImage.fromImage mevcut. Yoksa try/catch ile fallback yapıyoruz
    // @ts-ignore
    raw = (await (RawImage as any).fromImage)
      ? // @ts-ignore
        (RawImage as any).fromImage(bitmap)
      : RawImage.fromCanvas(srcCanvas)
  } catch {
    // Fallback (eski yol ama nadiren çalışır)
    const blob: Blob = await new Promise((resolve, reject) =>
      srcCanvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        0.7
      )
    )
    const url = URL.createObjectURL(blob)
    raw = await RawImage.fromURL(url)
    URL.revokeObjectURL(url)
  }

  // 2) CANLI işlem için küçük processor kullan
  const proc = state.liveProcessor ?? state.processor
  const { pixel_values } = await proc(raw)
  const { output } = await state.model({ input: pixel_values })

  // 3) Maskeyi hedef boyuta getir
  const maskImage = await RawImage.fromTensor(
    output[0].mul(255).to("uint8")
  ).resize(targetWidth, targetHeight)

  return maskImage.data as Uint8ClampedArray
}
