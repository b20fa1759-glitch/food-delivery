import { useParams } from 'react-router-dom'

export default function Restaurant() {
  const { id } = useParams() // the :id part of /restaurants/:id
  return <h1 className="text-2xl font-bold">Restaurant #{id} — coming next step</h1>
}
