// Desteklenen dillerin kodları
export type Locale = "tr" | "en" | "de" | "fr" | "ar"

// Kullanılacak çeviri anahtarları
export type TranslationKeys =
  | "title"
  | "modalTitle"
  | "modalBody"
  | "cancelButton"
  | "acceptButton"
  | "selectPrompt"
  | "unitLabel"
  | "backAlt"
  | "paymentPrompt"
  | "paymentSubheader"
  | "cashButton"
  | "creditButton"
  | "orText"
  | "amountLabel"
  | "promoQuestion"
  | "promoPlaceholder"
  | "applyButton"
  | "loadingText"
  | "completedButton"
  | "promoSuccess"
  | "promoInvalid"
  | "discountApplied"
  | "posInstruction"
  | "paymentSuccessTitle"
  | "paymentSuccessBody"
  | "instruction1"
  | "instruction2"
  | "instruction3"
  | "paidLabel"
  | "remainingLabel"
  | "retakeButton"
  | "cardAlt"
  | "backgroundsTitle"
  | "noBackground"
  | "noFilter"
  | "samplePlaceholder"
  | "captureButton"
  | "cameraBackButton"
  | "decorateTitle"
  | "effectTab"
  | "stickerTab"
  | "textTab"
  | "removeButton"
  | "proceedButton"
  | "selectEffectTitle"
  | "selectStickerTitle"
  | "addTextTitle"
  | "textPlaceholder"
  | "printShareTitle"
  | "logoutButton"
  | "emailAction"
  | "smsAction"
  | "printAction"
  | "exitTitle"
  | "exitReminder"
  | "pickupReminder"
  | "exitEmoji"
  | "exitSubtext"
  | "homeButton"
  | "preparingPrint"
  // New keys for photo page
  | "removingBackground"
  | "backgroundRemovalReady"
  | "loadingModel"
  | "takePhotoInstruction"
  | "cameraAccessDenied"
  | "backgroundRemovalNotReady"
  | "backgroundRemovalFailed"
  | "processing"
  | "processingYourPhoto"
  | "removeBgAgain"
  | "removeBg"
  | "cancelText"
  | "saveText"
  | "typeAwesome"
  | "sizeLabel"
  | "chooseColor"
  | "fontTab"
  | "styleTab"
  | "boldText"
  | "italicText"
  | "underText"
  | "addTextButton"
  | "removeTextButton"
  | "selectPhotoFirst"
  | "chooseFromThumbnails"
  | "allCategory"
  | "loveCategory"
  | "specialDayCategory"
  | "sportsCategory"
  | "summerCategory"
  | "winterCategory"
  | "demo1Category"
  | "demo2Category"
  | "demo3Category"
  | "demo4Category"
  | "natureCategory"
  | "kidsCategory"
  | "fantasticCategory"
  | "footballCategory"
  | "graphicCategory"
  | "colorsCategory"
  | "safariCategory"
  | "cityCategory"
  | "glitterEffect"
  | "sepiaEffect"
  | "blackWhiteEffect"
  | "getReady"
  | "selectBackgroundFirst"
  | "photoCaptured"
  | "retakeLeft"
  | "onlyEditingAllowed"
  | "backgroundSelected"
  | "selectBackgroundWarning"
  | "confirmBackgroundSelection"
  | "confirmBackgroundMessage"
  | "selectionFinal"
  | "cancel"
  | "confirm"
  | "noBackgroundSelected"
  | "outputCount"
  | "retakeRights"
  | "rightsLeft"
  | "sameBackground"
  | "selectFromPanel"
  | "noPhotosFound"
  | "noPhotosAvailable"
  | "photosAfterCapture"
  | "confirmPaymentButton"
  | "remainingTime"
  | "backToMenu"
  | "retakeInfoTooltip"
  | "selectPhotoToStyle"
  | "startShootingWarning" // New key

// Çeviri objesi
export const translations: Record<Locale, Record<TranslationKeys, string>> = {
  tr: {
    title: "Social Booth",
    modalTitle: "KVKK Onayı",
    modalBody:
      "Fotoğrafınızın basılması ve işlemlerinin devamı için KVKK metnini okumanız ve onay vermeniz gerekmektedir. Lütfen aşağıdaki metni dikkatle inceleyiniz.",
    cancelButton: "Vazgeç",
    acceptButton: "Onayla",
    selectPrompt: "Kaç adet yazdırmak istersiniz?",
    unitLabel: "adet",
    backAlt: "Geri",
    paymentPrompt: "Ödeme yöntemini seçiniz.",
    paymentSubheader: "Ödeme yöntemini seçiniz:",
    cashButton: "NAKİT",
    creditButton: "KREDİ KARTI",
    orText: "ya da",
    amountLabel: "TUTAR",
    promoQuestion: "Promosyon Kodu Kullan",
    promoPlaceholder: "Promosyon kodu",
    applyButton: "Uygula",
    loadingText: "Ödeme Yükleniyor…",
    completedButton: "Baskı Ekranına Git",
    promoSuccess: "Promo kodu başarıyla uygulandı!",
    promoInvalid: "Geçersiz promo kodu",
    discountApplied: "indirim uygulandı",
    posInstruction: "Lütfen POS cihazından işleme devam edin.",
    paymentSuccessTitle: "Ödeme Tamamlandı",
    paymentSuccessBody:
      "İşlem başarıyla sonuçlandı. Fotoğraf çekim ekranına geçebilirsiniz.",
    instruction1:
      "Kağıt paraları tek tek yerleştirin. (Sadece 20TL, 50TL ve 100TL kabul edilmektedir.)",
    instruction2:
      "Tutardan fazla para ödemesi yapmayın. Para üstü verilmeyecektir.",
    instruction3: "Ödenen paranın iadesi yapılmayacaktır.",
    paidLabel: "ÖDENEN",
    remainingLabel: "KALAN",
    retakeButton: "Çekime Başla",
    cardAlt: "Kart Ödemesi",
    backgroundsTitle: "Sahneni Seç",
    noBackground: "Sahne yok",
    noFilter: "Filtre yok",
    samplePlaceholder: "Örnek",
    captureButton: "Çekime Başla",
    cameraBackButton: "Kameraya Dön",
    decorateTitle: "Tarzını Yarat",
    effectTab: "Filtre Ekle",
    stickerTab: "Aksesuar Ekle",
    textTab: "Metin Ekle",
    removeButton: "Kaldır",
    proceedButton: "Devam Et",
    selectEffectTitle: "Filtre Ekle",
    selectStickerTitle: "Aksesuar Ekle",
    addTextTitle: "Metin Ekle",
    textPlaceholder: "Metni buraya yaz…",
    printShareTitle: "Baskı ve Paylaşım",
    logoutButton: "Çıkış Yap",
    emailAction: "E-posta Gönder",
    smsAction: "SMS Gönder",
    printAction: "Kopya Baskı Al",
    exitTitle: "Social Booth",
    exitReminder: "Baskınızı almayı unutmayın",
    pickupReminder: "Baskınızı almayı unutmayın",
    exitEmoji: "😊",
    exitSubtext: "Anılarınızı ölümsüzleştirin ve sevdiklerinizle paylaşın.",
    homeButton: "Anasayfaya Dön",
    preparingPrint: "Baskınız hazırlanıyor",
    // New translations
    removingBackground: "Sahne kaldırılıyor...",
    backgroundRemovalReady: "Sahne kaldırma hazır",
    loadingModel: "Model yükleniyor...",
    takePhotoInstruction:
      'Fotoğraf çekin, ardından sahneyi kaldırmak için "Sahneyi Kaldır" düğmesine tıklayın',
    cameraAccessDenied: "Kameraya erişilemedi",
    backgroundRemovalNotReady:
      "Sahne kaldırma modeli hazır değil veya fotoğraf seçilmedi",
    backgroundRemovalFailed: "Sahne kaldırma başarısız",
    processing: "İşleniyor...",
    processingYourPhoto: "Resminizi özenle düzenliyoruz...",
    removeBgAgain: "Sahneyi Tekrar Kaldır",
    removeBg: "Sahneyi Kaldır",
    cancelText: "İptal",
    saveText: "Kaydet",
    typeAwesome: "Harika bir şey yazın...",
    sizeLabel: "Boyut",
    chooseColor: "Renk Seç",
    fontTab: "🔤 Font",
    styleTab: "💫 Stil",
    boldText: "Kalın",
    italicText: "Eğik",
    underText: "Altı Çizili",
    addTextButton: "✨ Metin Ekle",
    removeTextButton: "🗑️ Kaldır",
    selectPhotoFirst: "Metin eklemek için önce bir fotoğraf seçin",
    chooseFromThumbnails: "Küçük resimlerden bir fotoğraf seçin",
    allCategory: "Tümü",
    loveCategory: "Aşk",
    specialDayCategory: "Özel Gün",
    sportsCategory: "Spor",
    summerCategory: "Yaz",
    winterCategory: "Kış",
    demo1Category: "deneme1",
    demo2Category: "deneme2",
    demo3Category: "deneme3",
    demo4Category: "deneme4",
    natureCategory: "Doğa",
    kidsCategory: "Çocuklar için",
    fantasticCategory: "Fantastik",
    footballCategory: "Futbol",
    graphicCategory: "Grafik",
    colorsCategory: "Renkler",
    safariCategory: "Safari",
    cityCategory: "Şehir Simgeleri",
    glitterEffect: "Parıltı",
    sepiaEffect: "Sepya",
    blackWhiteEffect: "Siyah-Beyaz",
    getReady: "Hazır Ol",
    selectBackgroundFirst: "İçin Sahne Seçin",
    photoCaptured: "Fotoğraf Çekildi",
    retakeLeft: "Yeniden Çek",
    onlyEditingAllowed: "📝 Artık sadece düzenleme yapabilirsiniz",
    backgroundSelected: "✅ Sahne seçildi - Fotoğraf çekebilirsiniz",
    selectBackgroundWarning:
      "👆 Önce bir sahne seçin (seçim sonrası değiştirilemez)",
    confirmBackgroundSelection: "Sahne Seçimini Onaylayın",
    confirmBackgroundMessage: "Bu sahneyi seçmek istediğinizden emin misiniz?",
    selectionFinal: "⚠️ Seçim sonrası değiştirilemez!",
    cancel: "❌ İptal",
    confirm: "✅ Onayla",
    noBackgroundSelected: "Sahne Yok",
    outputCount: "çıktı alınacak",
    retakeRights: "Yeniden Çekim Hakkı",
    rightsLeft: "hak kaldı",
    sameBackground: "Aynı sahne için",
    selectFromPanel: "Sol panelden bir sahne seçin",
    noPhotosFound: "Fotoğraf bulunamadı! Detaylar için konsolu kontrol edin.",
    noPhotosAvailable: "Fotoğraf mevcut değil",
    photosAfterCapture:
      "Fotoğraf sayfasında çektikten sonra burada görünecekler",
    confirmPaymentButton: "Ödeme Tamamlandı",
    remainingTime: "Kalan Süre",
    backToMenu: "Menüye Dön",
    retakeInfoTooltip:
      "Yeniden çekim hakkınız: Aynı sahne için maksimum 2 kez yeniden çekim yapabilirsiniz. Bu haklar tükendikten sonra sadece düzenleme yapabilirsiniz.",
    selectPhotoToStyle: "Filtre, aksesuar veya metin eklemek için önce fotoğraf çekin.",
    startShootingWarning: "Çekime başlamak için önce arka plan seçmelisin",
  },

  en: {
    title: "Social Booth",
    modalTitle: "GDPR Approval",
    modalBody:
      "To proceed with printing your photo and related processes, you must read and approve the GDPR text. Please carefully review the text below.",
    cancelButton: "Cancel",
    acceptButton: "Accept",
    selectPrompt: "How many would you like to print?",
    unitLabel: "pcs",
    backAlt: "Back",
    paymentPrompt: "Please select a payment method.",
    paymentSubheader: "Select payment method:",
    cashButton: "Cash",
    creditButton: "Credit Card",
    orText: "or",
    amountLabel: "Amount",
    promoQuestion: "Use Promo Code",
    promoPlaceholder: "Promo code",
    applyButton: "Apply",
    loadingText: "Loading payment…",
    completedButton: "Go to print screen",
    promoSuccess: "Promo code applied successfully!",
    promoInvalid: "Invalid promo code",
    discountApplied: "discount applied",
    posInstruction: "Please continue the process on the POS device.",
    paymentSuccessTitle: "Payment Completed",
    paymentSuccessBody:
      "Your transaction was successful. You can proceed to the photo screen.",
    instruction1:
      "Insert paper bills one by one. (Only 20TL, 50TL and 100TL are accepted.)",
    instruction2:
      "Do not insert more than the total amount; no change will be given.",
    instruction3: "Paid money cannot be refunded.",
    paidLabel: "PAID",
    remainingLabel: "REMAINING",
    retakeButton: "Retake Photo",
    cardAlt: "Card Payment",
    backgroundsTitle: "Choose Your Scene",
    noBackground: "No Scene",
    noFilter: "No Filter",
    samplePlaceholder: "Sample",
    captureButton: "Start Capture",
    cameraBackButton: "Back to Camera",
    decorateTitle: "Create Your Style",
    effectTab: "Add Filter",
    stickerTab: "Add Accessory",
    textTab: "Text",
    removeButton: "Remove",
    proceedButton: "Proceed",
    selectEffectTitle: "Add Filter",
    selectStickerTitle: "Select Sticker",
    addTextTitle: "Add Text",
    textPlaceholder: "Type your text…",
    printShareTitle: "Print & Share",
    logoutButton: "Log Out",
    emailAction: "Send Email",
    smsAction: "Send SMS",
    printAction: "Print Copy",
    exitTitle: "Social Booth",
    exitReminder: "Don't forget to pick up your prints",
    pickupReminder: "Don't forget to pick up your prints",
    exitEmoji: "😊",
    exitSubtext: "Capture your memories and share them with loved ones.",
    homeButton: "Go Home",
    preparingPrint: "Your print is being prepared",
    // New translations
    removingBackground: "Removing background...",
    backgroundRemovalReady: "Background removal ready",
    loadingModel: "Loading model...",
    takePhotoInstruction:
      'Take a photo, then click "Remove BG" to remove background',
    cameraAccessDenied: "Camera access denied",
    backgroundRemovalNotReady:
      "Background removal model not ready or no photo selected",
    backgroundRemovalFailed: "Background removal failed",
    processing: "Processing...",
    processingYourPhoto: "Carefully editing your photo...",
    removeBgAgain: "Remove BG Again",
    removeBg: "Remove BG",
    cancelText: "Cancel",
    saveText: "Save",
    typeAwesome: "Type something awesome...",
    sizeLabel: "Size",
    chooseColor: "Choose Color",
    fontTab: "🔤 Font",
    styleTab: "💫 Style",
    boldText: "Bold",
    italicText: "Italic",
    underText: "Under",
    addTextButton: "✨ Add Text",
    removeTextButton: "🗑️ Remove",
    selectPhotoFirst: "Please select a photo first to add text",
    chooseFromThumbnails: "Choose a photo from the thumbnails",
    allCategory: "All",
    loveCategory: "Love",
    natureCategory: "Nature",
    kidsCategory: "Kids",
    fantasticCategory: "Fantastic",
    footballCategory: "Football",
    graphicCategory: "Graphic",
    colorsCategory: "Colors",
    safariCategory: "Safari",
    cityCategory: "City",
    specialDayCategory: "Special Day",
    sportsCategory: "Sports",
    summerCategory: "Summer",
    winterCategory: "Winter",
    demo1Category: "demo1",
    demo2Category: "demo2",
    demo3Category: "demo3",
    demo4Category: "demo4",
    glitterEffect: "Glitter",
    sepiaEffect: "Sepia",
    blackWhiteEffect: "Black & White",
    getReady: "Get Ready",
    selectBackgroundFirst: "Choose a scene first",
    photoCaptured: "Photo Captured",
    retakeLeft: "Retake",
    onlyEditingAllowed: "📝 Only editing is allowed now",
    backgroundSelected: "✅ Scene selected - You can take photo",
    selectBackgroundWarning:
      "👆 Select a scene first (cannot be changed after selection)",
    confirmBackgroundSelection: "Confirm Scene Selection",
    confirmBackgroundMessage: "Are you sure you want to select this scene?",
    selectionFinal: "⚠️ Cannot be changed after selection!",
    cancel: "❌ Cancel",
    confirm: "✅ Confirm",
    noBackgroundSelected: "No Scene",
    outputCount: "prints will be taken",
    retakeRights: "Retake Rights",
    rightsLeft: "rights left",
    sameBackground: "For same scene",
    selectFromPanel: "Select a scene from left panel",
    noPhotosFound: "No photos found! Check console for details.",
    noPhotosAvailable: "No photos available",
    photosAfterCapture:
      "Photos should appear here after taking them on the photo page",
    confirmPaymentButton: "Payment Completed",
    remainingTime: "Remaining",
    backToMenu: "Back to Menu",
    retakeInfoTooltip:
      "Your retake rights: You can retake up to 2 times for the same scene. After these rights are exhausted, you can only edit.",
    selectPhotoToStyle:
      "Please take a photo first to add filters, accessories, or text.",
    startShootingWarning: "You must select a background first to start shooting",
  },

  de: {
    title: "Social Booth",
    modalTitle: "DSGVO-Zustimmung",
    modalBody:
      "Um mit dem Drucken Ihres Fotos und den damit verbundenen Prozessen fortzufahren, müssen Sie den DSGVO-Text lesen und zustimmen. Bitte prüfen Sie den Text unten sorgfältig.",
    cancelButton: "Abbrechen",
    acceptButton: "Zustimmen",
    selectPrompt: "Wie viele möchten Sie drucken?",
    unitLabel: "Stk",
    backAlt: "Zurück",
    paymentPrompt: "Bitte wählen Sie eine Zahlungsmethode.",
    paymentSubheader: "Zahlungsmethode auswählen:",
    cashButton: "Bargeld",
    creditButton: "Kreditkarte",
    orText: "oder",
    amountLabel: "BETRAG",
    promoQuestion: "Promo-Code Verwenden",
    promoPlaceholder: "Promo-Code",
    applyButton: "Anwenden",
    loadingText: "Zahlung wird geladen…",
    completedButton: "Zum Druckbildschirm wechseln",
    promoSuccess: "Promo-Code erfolgreich angewendet!",
    promoInvalid: "Ungültiger Promo-Code",
    discountApplied: "Rabatt angewendet",
    posInstruction: "Bitte fahren Sie den Vorgang am POS-Gerät fort.",
    paymentSuccessTitle: "Zahlung abgeschlossen",
    paymentSuccessBody:
      "Die Transaktion war erfolgreich. Sie können zum Foto-Bildschirm wechseln.",
    instruction1:
      "Legen Sie die Geldscheine einzeln ein. (Nur 20TL, 50TL und 100TL akzeptiert.)",
    instruction2:
      "Stecken Sie nicht mehr als den Gesamtbetrag ein; Wechselgeld wird nicht zurückgegeben.",
    instruction3: "Eingezahltes Geld kann nicht zurückerstattet werden.",
    paidLabel: "BEZAHLT",
    remainingLabel: "VERBLEIBEND",
    retakeButton: "Foto erneut aufnehmen",
    cardAlt: "Kartenzahlung",
    backgroundsTitle: "Wähle deine Szene",
    noBackground: "Keine Szene",
    noFilter: "Kein Filter",
    samplePlaceholder: "Beispiel",
    captureButton: "Foto aufnehmen",
    cameraBackButton: "Zurück zur Kamera",
    decorateTitle: "Kreiere deinen Stil",
    effectTab: "Filter hinzufügen",
    stickerTab: "Zubehör hinzufügen",
    textTab: "Text",
    removeButton: "Entfernen",
    proceedButton: "Weiter",
    selectEffectTitle: "Filter hinzufügen",
    selectStickerTitle: "Sticker auswählen",
    addTextTitle: "Text hinzufügen",
    textPlaceholder: "Text hier eingeben…",
    printShareTitle: "Drucken & Teilen",
    logoutButton: "Abmelden",
    emailAction: "E-Mail senden",
    smsAction: "SMS senden",
    printAction: "Kopie drucken",
    exitTitle: "Social Booth",
    exitReminder: "Vergessen Sie nicht, Ihre Ausdrucke abzuholen",
    pickupReminder: "Vergessen Sie nicht, Ihre Ausdrucke abzuholen",
    exitEmoji: "😊",
    exitSubtext:
      "Halten Sie Ihre Erinnerungen fest und teilen Sie sie mit Ihren Lieben.",
    homeButton: "Nach Hause",
    preparingPrint: "Ihr Druck wird vorbereitet",
    // New translations
    removingBackground: "Hintergrund wird entfernt...",
    backgroundRemovalReady: "Hintergrundentfernung bereit",
    loadingModel: "Modell wird geladen...",
    takePhotoInstruction:
      'Machen Sie ein Foto und klicken Sie dann auf "Hintergrund entfernen"',
    cameraAccessDenied: "Kamerazugriff verweigert",
    backgroundRemovalNotReady:
      "Hintergrundentfernung nicht bereit oder kein Foto ausgewählt",
    backgroundRemovalFailed: "Hintergrundentfernung fehlgeschlagen",
    processing: "Verarbeitung...",
    processingYourPhoto: "Ihr Foto wird sorgfältig bearbeitet...",
    removeBgAgain: "Hintergrund erneut entfernen",
    removeBg: "Hintergrund entfernen",
    cancelText: "Abbrechen",
    saveText: "Speichern",
    typeAwesome: "Schreiben Sie etwas Großartiges...",
    sizeLabel: "Größe",
    chooseColor: "Farbe wählen",
    fontTab: "🔤 Schrift",
    styleTab: "💫 Stil",
    boldText: "Fett",
    italicText: "Kursiv",
    underText: "Unterstrichen",
    addTextButton: "✨ Text hinzufügen",
    removeTextButton: "🗑️ Entfernen",
    selectPhotoFirst:
      "Bitte wählen Sie zuerst ein Foto aus, um Text hinzuzufügen",
    chooseFromThumbnails: "Wählen Sie ein Foto aus den Vorschaubildern",
    allCategory: "Alle",
    loveCategory: "Liebe",
    natureCategory: "Natur",
    kidsCategory: "Kinder",
    fantasticCategory: "Fantastisch",
    footballCategory: "Fußball",
    graphicCategory: "Grafik",
    colorsCategory: "Farben",
    safariCategory: "Safari",
    cityCategory: "Stadt",
    specialDayCategory: "Besonderer Tag",
    sportsCategory: "Sport",
    summerCategory: "Sommer",
    winterCategory: "Winter",
    demo1Category: "Demo1",
    demo2Category: "Demo2",
    demo3Category: "Demo3",
    demo4Category: "Demo4",
    glitterEffect: "Glitzer",
    sepiaEffect: "Sepia",
    blackWhiteEffect: "Schwarz-Weiß",
    getReady: "Mach dich bereit",
    selectBackgroundFirst: "Wähle zuerst eine Szene",
    photoCaptured: "Foto aufgenommen",
    retakeLeft: "Wiederholen",
    onlyEditingAllowed: "📝 Nur Bearbeitung ist jetzt erlaubt",
    backgroundSelected: "✅ Szene ausgewählt - Sie können Foto machen",
    selectBackgroundWarning:
      "👆 Szene zuerst auswählen (kann nach Auswahl nicht geändert werden)",
    confirmBackgroundSelection: "Szenenauswahl bestätigen",
    confirmBackgroundMessage:
      "Sind Sie sicher, dass Sie diese Szene auswählen möchten?",
    selectionFinal: "⚠️ Kann nach Auswahl nicht geändert werden!",
    cancel: "❌ Abbrechen",
    confirm: "✅ Bestätigen",
    noBackgroundSelected: "Keine Szene",
    outputCount: "Drucke werden genommen",
    retakeRights: "Wiederholungsrechte",
    rightsLeft: "Rechte übrig",
    sameBackground: "Für dieselbe Szene",
    selectFromPanel: "Wählen Sie eine Szene aus dem linken Panel",
    noPhotosFound:
      "Keine Fotos gefunden! Überprüfen Sie die Konsole für Details.",
    noPhotosAvailable: "Keine Fotos verfügbar",
    photosAfterCapture:
      "Fotos sollten hier erscheinen, nachdem sie auf der Fotoseite aufgenommen wurden",
    confirmPaymentButton: "Zahlung abgeschlossen",
    remainingTime: "Verbleibende Zeit",
    backToMenu: "Zurück zum Menü",
    retakeInfoTooltip:
      "Ihre Wiederholungsrechte: Sie können bis zu 2 Mal für dieselbe Szene wiederholen. Nachdem diese Rechte erschöpft sind, können Sie nur noch bearbeiten.",
    selectPhotoToStyle:
      "Bitte machen Sie zuerst ein Foto, um Filter, Zubehör oder Text hinzuzufügen.",
    startShootingWarning:
      "Sie müssen einen Hintergrund auswählen, um die Aufnahme zu starten",
  },

  fr: {
    title: "Social Booth",
    modalTitle: "Approbation RGPD",
    modalBody:
      "Pour poursuivre l'impression de votre photo et les processus associés, vous devez lire et approuver le texte RGPD. Veuillez examiner attentivement le texte ci-dessous.",
    cancelButton: "Annuler",
    acceptButton: "Accepter",
    selectPrompt: "Combien souhaitez-vous imprimer ?",
    unitLabel: "pcs",
    backAlt: "Retour",
    paymentPrompt: "Veuillez sélectionner un mode de paiement.",
    paymentSubheader: "Sélectionnez le mode de paiement :",
    cashButton: "Espèces",
    creditButton: "Carte de crédit",
    orText: "ou",
    amountLabel: "Montant",
    promoQuestion: "Promo-Code Verwenden",
    promoPlaceholder: "Code promo",
    applyButton: "Appliquer",
    loadingText: "Chargement du paiement…",
    completedButton: "Aller à l'écran d'impression",
    promoSuccess: "Code promo appliqué avec succès !",
    promoInvalid: "Code promo invalide",
    discountApplied: "réduction appliquée",
    posInstruction:
      "Veuillez continuer le processus sur le terminal de paiement.",
    paymentSuccessTitle: "Paiement terminé",
    paymentSuccessBody:
      "Votre transaction a réussi. Vous pouvez passer à l'écran photo.",
    instruction1:
      "Insérez les billets un par un. (Seulement 20TL, 50TL et 100TL sont acceptés.)",
    instruction2:
      "N'insérez pas plus que le montant total ; aucune monnaie ne sera rendue.",
    instruction3: "L'argent payé ne pourra pas être remboursé.",
    paidLabel: "PAYÉ",
    remainingLabel: "RESTANT",
    retakeButton: "Reprendre la photo",
    cardAlt: "Paiement par carte",
    backgroundsTitle: "Choisis ta scène",
    noBackground: "Pas de scène",
    noFilter: "Pas de filtre",
    samplePlaceholder: "Exemple",
    captureButton: "Prendre une photo",
    cameraBackButton: "Retour à la caméra",
    decorateTitle: "Crée ton style",
    effectTab: "Ajouter un filtre",
    stickerTab: "Ajouter un accessoire",
    textTab: "Texte",
    removeButton: "Supprimer",
    proceedButton: "Continuer",
    selectEffectTitle: "Ajouter un filtre",
    selectStickerTitle: "Choisir un sticker",
    addTextTitle: "Ajouter du texte",
    textPlaceholder: "Tapez votre texte…",
    printShareTitle: "Impression & Partage",
    logoutButton: "Déconnexion",
    emailAction: "Envoyer un e-mail",
    smsAction: "Envoyer un SMS",
    printAction: "Imprimer une copie",
    exitTitle: "Social Booth",
    exitReminder: "N'oubliez pas de récupérer vos tirages",
    pickupReminder: "N'oubliez pas de récupérer vos tirages",
    exitEmoji: "😊",
    exitSubtext: "Immortalisez vos souvenirs et partagez-les avec vos proches.",
    homeButton: "Aller à l'accueil",
    preparingPrint: "Votre impression est en préparation",
    // New translations
    removingBackground: "Suppression de l'arrière-plan...",
    backgroundRemovalReady: "Suppression d'arrière-plan prête",
    loadingModel: "Chargement du modèle...",
    takePhotoInstruction:
      'Prenez une photo, puis cliquez sur "Supprimer l\'arrière-plan"',
    cameraAccessDenied: "Accès à la caméra refusé",
    backgroundRemovalNotReady:
      "Modèle de suppression d'arrière-plan non prêt ou aucune photo sélectionnée",
    backgroundRemovalFailed: "Échec de la suppression de l'arrière-plan",
    processing: "Traitement...",
    processingYourPhoto: "Édition soigneuse de votre photo...",
    removeBgAgain: "Supprimer l'arrière-plan à nouveau",
    removeBg: "Supprimer l'arrière-plan",
    cancelText: "Annuler",
    saveText: "Enregistrer",
    typeAwesome: "Tapez quelque chose de génial...",
    sizeLabel: "Taille",
    chooseColor: "Choisir la couleur",
    fontTab: "🔤 Police",
    styleTab: "💫 Style",
    boldText: "Gras",
    italicText: "Italique",
    underText: "Souligné",
    addTextButton: "✨ Ajouter du texte",
    removeTextButton: "🗑️ Supprimer",
    selectPhotoFirst:
      "Veuillez d'abord sélectionner une photo pour ajouter du texte",
    chooseFromThumbnails: "Choisissez une photo parmi les miniatures",
    allCategory: "Tout",
    loveCategory: "Amour",
    natureCategory: "Nature",
    kidsCategory: "Enfants",
    fantasticCategory: "Fantastique",
    footballCategory: "Football",
    graphicCategory: "Graphique",
    colorsCategory: "Couleurs",
    safariCategory: "Safari",
    cityCategory: "Ville",
    specialDayCategory: "Jour spécial",
    sportsCategory: "Sports",
    summerCategory: "Été",
    winterCategory: "Hiver",
    demo1Category: "Démo1",
    demo2Category: "Démo2",
    demo3Category: "Démo3",
    demo4Category: "Démo4",
    glitterEffect: "Paillettes",
    sepiaEffect: "Sépia",
    blackWhiteEffect: "Noir et blanc",
    getReady: "Prépare-toi",
    selectBackgroundFirst: "Choisis d'abord une scène",
    photoCaptured: "Photo prise",
    retakeLeft: "Reprendre",
    onlyEditingAllowed: "📝 Seule l'édition est autorisée maintenant",
    backgroundSelected: "✅ Scène sélectionnée - Vous pouvez prendre une photo",
    selectBackgroundWarning:
      "👆 Sélectionner d'abord une scène (ne peut pas être modifié après sélection)",
    confirmBackgroundSelection: "Confirmer la sélection de la scène",
    confirmBackgroundMessage:
      "Êtes-vous sûr de vouloir sélectionner cette scène ?",
    selectionFinal: "⚠️ Ne peut pas être modifié après sélection!",
    cancel: "❌ Annuler",
    confirm: "✅ Confirmer",
    noBackgroundSelected: "Pas de scène",
    outputCount: "impressions seront prises",
    retakeRights: "Droits de reprise",
    rightsLeft: "droits restants",
    sameBackground: "Pour la même scène",
    selectFromPanel: "Sélectionnez une scène depuis le panneau de gauche",
    noPhotosFound:
      "Aucune photo trouvée ! Vérifiez la console pour plus de détails.",
    noPhotosAvailable: "Aucune photo disponible",
    photosAfterCapture:
      "Les photos devraient apparaître ici après les avoir prises sur la page photo",
    confirmPaymentButton: "Paiement terminé",
    remainingTime: "Temps restant",
    backToMenu: "Retour au menu",
    retakeInfoTooltip:
      "Vos droits de reprise : Vous pouvez reprendre jusqu'à 2 fois pour la même scène. Après que ces droits soient épuisés, vous ne pouvez que modifier.",
    selectPhotoToStyle:
      "Veuillez d'abord prendre une photo pour ajouter des filtres, des accessoires ou du texte.",
    startShootingWarning:
      "Vous devez sélectionner un arrière-plan pour commencer la prise de vue",
  },

  ar: {
    title: "Social Booth",
    modalTitle: "الموافقة على حماية البيانات",
    modalBody:
      "للمضي قدمًا في طباعة صورتك والإجراءات المتعلقة بها، يجب عليك قراءة نص اللائحة العامة لحماية البيانات والموافقة عليه. يرجى مراجعة النص أدناه بعناية.",
    cancelButton: "إلغاء",
    acceptButton: "موافقة",
    selectPrompt: "كم عدد النسخ التي تريد طباعتها؟",
    unitLabel: "قطع",
    backAlt: "رجوع",
    paymentPrompt: "يرجى اختيار طريقة الدفع.",
    paymentSubheader: "اختر طريقة الدفع:",
    cashButton: "نقدًا",
    creditButton: "بطاقة ائتمان",
    orText: "أو",
    amountLabel: "المبلغ",
    promoQuestion: "رمز ترويجي استخدم",
    promoPlaceholder: "رمز ترويجي",
    applyButton: "تطبيق",
    loadingText: "جاري تحميل الدفع…",
    completedButton: "الانتقال إلى شاشة الطباعة",
    promoSuccess: "تم تطبيق الرمز الترويجي بنجاح!",
    promoInvalid: "رمز ترويجي غير صالح",
    discountApplied: "تم تطبيق الخصم",
    posInstruction: "يرجى متابعة العملية على جهاز نقاط البيع (POS).",
    paymentSuccessTitle: "اكتمل الدفع",
    paymentSuccessBody: "تمت العملية بنجاح. يمكنك الانتقال إلى شاشة التصوير.",
    instruction1:
      "أدخل الأوراق النقدية واحدة تلو الأخرى. (فقط 20TL, 50TL و 100TL مقبولة.)",
    instruction2: "لا تدخل أكثر من المبلغ الإجمالي؛ لن يتم إعطاء الباقي.",
    instruction3: "لا يمكن استرداد الأموال  المدفوعة.",
    paidLabel: "مدفوع",
    remainingLabel: "المتبقي",
    retakeButton: "التقاط الصورة مجددًا",
    cardAlt: "دفع بالبطاقة",
    backgroundsTitle: "اختر مشهدك",
    noBackground: "لا مشهد",
    noFilter: "لا يوجد فلتر",
    samplePlaceholder: "عينة",
    captureButton: "التقاط صورة",
    cameraBackButton: "العودة للكاميرا",
    decorateTitle: "اصنع أسلوبك",
    effectTab: "أضف فلترًا",
    stickerTab: "أضف ملحقًا",
    textTab: "نص",
    removeButton: "إزالة",
    proceedButton: "متابعة",
    selectEffectTitle: "أضف فلترًا",
    selectStickerTitle: "اختر ملصقًا",
    addTextTitle: "أضف نصًا",
    textPlaceholder: "اكتب نصك…",
    printShareTitle: "الطباعة والمشاركة",
    logoutButton: "تسجيل خروج",
    emailAction: "إرسال بريد إلكتروني",
    smsAction: "إرسال رسالة SMS",
    printAction: "طباعة نسخة",
    exitTitle: "Social Booth",
    exitReminder: "لا تنسَ استلام مطبوعاتك",
    pickupReminder: "لا تنسَ استلام مطبوعاتك",
    exitEmoji: "😊",
    exitSubtext: "خلد ذكرياتك وشاركها مع أحبائك.",
    homeButton: "العودة للصفحة الرئيسية",
    preparingPrint: "جاري تحضير مطبوعتك",
    // New translations
    removingBackground: "جاري إزالة الخلفية...",
    backgroundRemovalReady: "إزالة الخلفية جاهزة",
    loadingModel: "جاري تحميل النموذج...",
    takePhotoInstruction: 'التقط صورة، ثم انقر على "إزالة الخلفية"',
    cameraAccessDenied: "تم رفض الوصول للكاميرا",
    backgroundRemovalNotReady:
      "نموذج إزالة الخلفية غير جاهز أو لم يتم اختيار صورة",
    backgroundRemovalFailed: "فشل في إزالة الخلفية",
    processing: "جاري المعالجة...",
    processingYourPhoto: "جاري تحرير صورتك بعناية...",
    removeBgAgain: "إزالة الخلفية مرة أخرى",
    removeBg: "إزالة الخلفية",
    cancelText: "إلغاء",
    saveText: "حفظ",
    typeAwesome: "اكتب شيئًا رائعًا...",
    selectPhotoToStyle: "يرجى التقاط صورة أولاً لإضافة فلاتر أو ملحقات أو نص.",
    sizeLabel: "الحجم",

    chooseColor: "اختر اللون",
    fontTab: "🔤 الخط",
    styleTab: "💫 النمط",
    boldText: "عريض",
    italicText: "مائل",
    underText: "تحته خط",
    addTextButton: "✨ أضف نص",
    removeTextButton: "🗑️ إزالة",
    selectPhotoFirst: "يرجى اختيار صورة أولاً لإضافة نص",
    chooseFromThumbnails: "اختر صورة من الصور المصغرة",
    allCategory: "الكل",
    loveCategory: "الحب",
    natureCategory: "الطبيعة",
    kidsCategory: "الأطفال",
    fantasticCategory: "فانتاستيك",
    footballCategory: "الكرة الطائرة",
    graphicCategory: "الرسومية",
    colorsCategory: "الألوان",
    safariCategory: "السفاري",
    cityCategory: "المدينة",
    specialDayCategory: "يوم خاص",
    sportsCategory: "الرياضة",
    summerCategory: "الصيف",
    winterCategory: "الشتاء",
    demo1Category: "تجريبي1",
    demo2Category: "تجريبي2",
    demo3Category: "تجريبي3",
    demo4Category: "تجريبي4",
    glitterEffect: "بريق",
    sepiaEffect: "بني داكن",
    blackWhiteEffect: "أبيض وأسود",
    getReady: "استعد",
    selectBackgroundFirst: "اختر مشهدًا أولاً",
    photoCaptured: "تم التقاط الصورة",
    retakeLeft: "إعادة التقاط",
    onlyEditingAllowed: "📝 الآن يُسمح بالتحرير فقط",
    backgroundSelected: "✅ تم اختيار المشهد - يمكنك التقاط صورة",
    selectBackgroundWarning:
      "👆 اختر مشهدًا أولاً (لا يمكن تغييره بعد الاختيار)",
    confirmBackgroundSelection: "تأكيد اختيار المشهد",
    confirmBackgroundMessage: "هل أنت متأكد من أنك تريد اختيار هذا المشهد؟",
    selectionFinal: "⚠️ لا يمكن تغييرها بعد الاختيار!",
    cancel: "❌ إلغاء",
    confirm: "✅ تأكيد",
    noBackgroundSelected: "لا مشهد",
    outputCount: "مطبوعات ستؤخذ",
    retakeRights: "حقوق إعادة التقاط",
    rightsLeft: "حقوق متبقية",
    sameBackground: "لنفس المشهد",
    selectFromPanel: "اختر مشهدًا من اللوحة اليسرى",
    noPhotosFound:
      "لم يتم العثور على صور! تحقق من وحدة التحكم للحصول على التفاصيل.",
    noPhotosAvailable: "لا توجد صور متاحة",
    photosAfterCapture: "يجب أن تظهر الصور هنا بعد التقاطها في صفحة الصور",
    confirmPaymentButton: "الدفع منتهي",
    remainingTime: "الوقت المتبقي",
    backToMenu: "العودة إلى القائمة",
    retakeInfoTooltip:
      "حقوق إعادة التقاط: يمكنك إعادة التقاط حتى مرتين لنفس المشهد. بعد استنفاد هذه الحقوق، يمكنك التحرير فقط.",
    startShootingWarning: "يجب عليك اختيار خلفية أولا لبدء التصوير",
  },
}
