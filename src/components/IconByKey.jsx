import { icons } from '../data/icons'

export default function IconByKey({ name, ...props }) {
  const Icon = (icons[name] || icons.heart)[1]
  return <Icon {...props} />
}
