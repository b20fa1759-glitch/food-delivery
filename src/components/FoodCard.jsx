import { formatPrice } from '../utils/format'

// Props: item = the dish, showRestaurant = also show which restaurant it is from
export default function FoodCard({ item, showRestaurant = false }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
      {item.image_url ? (
        <img src={item.image_url} alt={item.name} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 bg-brand-100 flex items-center justify-center text-4xl">🍽️</div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold">{item.name}</h3>
        {showRestaurant && <p className="text-xs text-gray-400">{item.restaurants?.name}</p>}
        <p className="text-sm text-gray-500 mt-1 flex-1">{item.description}</p>
        <p className="mt-3 font-bold text-brand-600">{formatPrice(item.price)}</p>
      </div>
    </div>
  )
}
