export default function Footer() {
  return (
    <footer className="border-t bg-white py-6 text-center text-sm text-gray-500">
      <p>© {new Date().getFullYear()} FoodGo · Улаанбаатар дахь онлайн хоол хүргэлт</p>
      <p className="mt-1 text-xs text-gray-400">
        Сургалтын төсөл (SWE334). Ресторануудын нэрийг жишээ болгон ашигласан бөгөөд тэдгээр компанитай холбоогүй. Үнэ, цэс бодит биш.
      </p>
    </footer>
  )
}