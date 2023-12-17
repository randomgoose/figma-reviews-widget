import { chevron } from "../../icons"
import { Sort, SORT } from "../../types";

const translation = {
    ASCENDING_BY_TIME: "时间升序",
    DESCENDING_BY_TIME: "时间降序",
    ASCENDING_BY_RATE: "评分升序",
    DESCENDING_BY_RATE: "评分降序"
}

const { widget } = figma
const { useEffect, Text, AutoLayout, useSyncedState, SVG, Image, Rectangle, Line, Span, Input, usePropertyMenu, Frame } = widget

export function Sorter({ value, onChange }: { value: Sort; onChange: (value: Sort) => void }) {
    const [open, setOpen] = useSyncedState("sorter-open", false)

    return <AutoLayout verticalAlignItems={"center"} spacing={4} overflow={"visible"}>
        <SVG src={chevron} width={8} height={8} />
        <Text fontSize={12} lineHeight={20} onClick={() => setOpen(true)}>{translation[value]}</Text>

        {open
            ?
            <AutoLayout
                name="List"
                direction={"vertical"}
                positioning={"absolute"}
                overflow={"visible"}
                y={{ type: "bottom", offset: 28 }}
                stroke={"#e5e5e5"}
                fill={"#fff"}
                cornerRadius={6}
                padding={4}
                width={320}
            >
                {SORT.map((sort) => (
                    <AutoLayout
                        key={sort}
                        padding={{ vertical: 8, horizontal: 16 }}
                        width={"fill-parent"}
                        hoverStyle={{ fill: "#f5f5f5" }}
                        cornerRadius={3}
                        onClick={() => {
                            onChange(sort)
                            setOpen(false)
                        }}
                    >
                        <Text fontSize={12} lineHeight={20}>{translation[sort]}</Text>
                    </AutoLayout>
                ))}
            </AutoLayout>
            :
            null
        }
    </AutoLayout>
}