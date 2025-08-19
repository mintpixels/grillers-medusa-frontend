import { Pagination } from "react-instantsearch"

const StyledPagination = () => (
  <Pagination
    classNames={{
      list: "flex items-center space-x-2",
      item: "px-3 py-1 rounded-base border border-grey-20",
      link: "focus:outline-none",
      selectedItem: "bg-IsraelBlue text-white border-transparent",
      disabledItem: "opacity-50 cursor-not-allowed",
    }}
  />
)

export default StyledPagination
