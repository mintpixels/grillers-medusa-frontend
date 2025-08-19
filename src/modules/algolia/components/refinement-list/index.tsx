import { RefinementList } from "react-instantsearch"
const StyledRefinementList = ({
  attribute,
  customLabel,
}: {
  attribute: string
  customLabel?: string
}) => {
  const transformItems = (items: any) => {
    return items.map((item: any) => ({
      ...item,
      label: customLabel ?? item.label,
    }))
  }

  return (
    <RefinementList
      attribute={attribute}
      transformItems={transformItems}
      classNames={{
        list: "flex flex-col mb-1.5",
        item: "",
        label: "flex items-center text-p-sm text-Charcoal",
        checkbox: "form-checkbox h-4 w-4 text-VibrantRed mr-2",
        count: "ml-1 text-p-ex-sm-mono text-grey-50",
      }}
    />
  )
}

export default StyledRefinementList
