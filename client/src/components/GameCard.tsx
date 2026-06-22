interface GameCardProps {
    title: string;
    category: string;
    image: string;
    onClick?: () => void;
}

export function GameCard({
                             title,
                             category,
                             image,
                             onClick,
                         }: GameCardProps) {
    return (
        <div
            onClick={onClick}
            className="
                group
                cursor-pointer
                bg-gray-800/50
                rounded-lg
                overflow-hidden
                border
                border-gray-700/50
                hover:border-purple-500/50
                transition-all
                duration-300
                active:scale-[0.98]
                md:hover:scale-[1.03]
                backdrop-blur-sm
                shadow-md
                w-full
                min-w-0
            "
        >
            {/* IMAGE */}
            <div className="
                relative
                aspect-[1/1] sm:aspect-[4/3]
                overflow-hidden
                bg-gray-900
            ">
                <img
                    src={image}
                    alt={title}
                    className="
                        w-full
                        h-full
                        object-cover
                        transition-transform
                        duration-300
                        md:group-hover:scale-105
                    "
                />

                {/* OVERLAY */}
                <div className="
                        absolute
                        inset-0
                        bg-black/60
                        opacity-0
                        md:group-hover:opacity-100
                        transition
                        flex
                        items-center
                        justify-center
                    "
                >

                </div>
            </div>

            {/* CONTENT */}
            <div className="p-1.5 sm:p-4">
                <h3 className="
                    text-white
                    text-[11px]
                    sm:text-lg
                    font-semibold
                    truncate
                ">
                    {title}
                </h3>
                <p className="hidden sm:block text-gray-400 text-sm mt-0.5">
                    {category}
                </p>
            </div>
        </div>
    );
}
