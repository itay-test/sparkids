import { USERS } from '../config/users'

export default function UserSwitcher({ activeId, onChange }) {
  return (
    <div className="flex items-end gap-4 justify-center pt-1">
      {USERS.map(u => {
        const isActive = u.id === activeId
        return (
          <button
            key={u.id}
            onClick={() => onChange(u.id)}
            className="flex flex-col items-center gap-1 transition-all duration-200 active:scale-90"
          >
            <div className={`rounded-full overflow-hidden transition-all duration-200
              ${isActive
                ? 'ring-4 ring-purple-400 ring-offset-2 scale-110 shadow-lg'
                : 'opacity-50 hover:opacity-80 hover:scale-105'}`}
              style={{ width: isActive ? 56 : 48, height: isActive ? 56 : 48 }}>
              <img src={u.photo} alt={u.name} className="w-full h-full object-cover"/>
            </div>
            {/* Name only under active */}
            <span className={`font-black transition-all leading-none
              ${isActive ? 'text-purple-700 text-sm' : 'text-transparent text-xs'}`}>
              {u.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
