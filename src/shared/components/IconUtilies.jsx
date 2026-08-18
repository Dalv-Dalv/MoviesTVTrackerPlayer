function OutlinedIcon({
    Icon,
    size = 25,
    color = "hsl(210, 40%, 86%)",
    outlineColor = "hsl(210, 90%, 95%)",
    ...props
}) {
    return (
        <div
            className="relative inline-block"
            style={{ width: size, height: size }}
        >
            <Icon
                {...props}
                className="absolute inset-0"
                size={size}
                color={color}
                weight="fill"
            />
            <Icon
                {...props}
                className="absolute inset-0"
                size={size}
                color={outlineColor}
            />
        </div>
    );
}

export default OutlinedIcon;