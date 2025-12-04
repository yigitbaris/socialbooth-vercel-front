import { useGlobalContext } from "../context/GlobalContext"

const Test = () => {
  const { message, count } = useGlobalContext()
  return (
    <div>
      Test component {message}, count: {count}
    </div>
  )
}
export default Test
