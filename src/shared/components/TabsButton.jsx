export function TabsButton({ name, onClick, isSelected = false, className = '' }) {
    return (
        <div
            className={`relative first:rounded-l-full last:rounded-r-full p-2 noselect cursor-pointer text-body flex-1 ${className} transition-colors font-semibold ${isSelected ? '' : 'text-muted'} group`}
            onClick={onClick}
        >
            <div
                className={`absolute -inset-x-40 h-[200%] bg-[radial-gradient(circle_520px_at_50%_325px,white_50%,transparent_60%)] opacity-15 group-hover:opacity-20 group-active:opacity-30 transition-[opacity,translate] group-hover:-translate-y-2 duration-300 pointer-events-none
                ${isSelected ? 'opacity-35 group-hover:opacity-40 -translate-y-2 group-hover:-translate-y-2.5' : 'translate-y-4'}`}
            />

            <span className='relative z-10'>
                {name}
            </span>
        </div>
    )
}
