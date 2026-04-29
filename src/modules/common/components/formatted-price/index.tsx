type FormattedPriceProps = {
  value: string
  className?: string
  centsClassName?: string
}

export default function FormattedPrice({
  value,
  className,
  centsClassName,
}: FormattedPriceProps) {
  const match = value.match(/^(.*?)(\d[\d,. ]*)([.,])(\d{2})(\D*)$/)

  if (!match) {
    return <span className={className}>{value}</span>
  }

  const [, prefix, whole, , cents, suffix] = match

  return (
    <span className={className}>
      {prefix}
      {whole}
      <sup className={centsClassName ?? "text-[0.55em] -top-[0.6em] ml-[0.05em]"}>
        {cents}
      </sup>
      {suffix}
    </span>
  )
}
