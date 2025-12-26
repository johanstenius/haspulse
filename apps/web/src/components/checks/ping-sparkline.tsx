import type { SparklineSlot } from "@/lib/api"
import { cn } from "@/lib/utils"

type PingSparklineProps = {
	sparkline: SparklineSlot[]
}

const slotColors: Record<SparklineSlot, string> = {
	success: "bg-emerald-500",
	fail: "bg-red-500",
	missed: "bg-amber-500",
	empty: "bg-zinc-800",
}

export function PingSparkline({ sparkline }: PingSparklineProps) {
	return (
		<div className="flex gap-px">
			{sparkline.map((slot, i) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: static visual slots
					key={i}
					className={cn("w-2 h-4 rounded-sm", slotColors[slot])}
				/>
			))}
		</div>
	)
}
