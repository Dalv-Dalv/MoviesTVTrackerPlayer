export const PlayerButton = ({ children, onClick, className = '', ...props }) => {
    return (
        <button tabIndex={-1} className={`bg-black/10 hover:bg-black/40 p-1.5 rounded-sm transition-colors duration-200 ${className}`}
            onClick={onClick}
            {...props}>
            {children}
        </button>
    )
}
