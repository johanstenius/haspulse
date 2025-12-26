"use client"

import { useState } from "react"

export function CodeBlock() {
	const [tab, setTab] = useState<"sdk" | "fetch">("sdk")

	return (
		<div className="bg-card border border-border rounded-xl overflow-hidden">
			<div className="px-4 py-2 border-b border-border flex items-center gap-4">
				<button
					type="button"
					onClick={() => setTab("sdk")}
					className={`text-xs font-mono transition-colors ${
						tab === "sdk"
							? "text-foreground"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					SDK
				</button>
				<button
					type="button"
					onClick={() => setTab("fetch")}
					className={`text-xs font-mono transition-colors ${
						tab === "fetch"
							? "text-foreground"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					fetch
				</button>
			</div>
			<div className="p-6 font-mono text-sm whitespace-pre">
				{tab === "sdk" ? (
					<>
						<span className="text-muted-foreground">
							{"// Wrap your job - auto success/fail"}
						</span>
						{"\n"}
						<span className="text-primary">await</span>
						<span className="text-foreground"> haspulse.</span>
						<span className="text-primary">wrap</span>
						<span className="text-foreground">(</span>
						<span className="text-warning">&apos;db-backup&apos;</span>
						<span className="text-foreground">, </span>
						<span className="text-primary">async</span>
						<span className="text-foreground"> () </span>
						<span className="text-primary">=&gt;</span>
						<span className="text-foreground">{" {"}</span>
						{"\n  "}
						<span className="text-primary">await</span>
						<span className="text-foreground"> runBackup()</span>
						{"\n"}
						<span className="text-foreground">{"})"}</span>
					</>
				) : (
					<>
						<span className="text-primary">await</span>
						<span className="text-foreground"> </span>
						<span className="text-primary">fetch</span>
						<span className="text-foreground">(</span>
						<span className="text-warning">
							&apos;https://api.haspulse.dev/ping/db-backup&apos;
						</span>
						<span className="text-foreground">{", {"}</span>
						{"\n  "}
						<span className="text-foreground">{"headers: { "}</span>
						<span className="text-warning">Authorization</span>
						<span className="text-foreground">: </span>
						<span className="text-warning">{"`Bearer ${API_KEY}`"}</span>
						<span className="text-foreground">{" }"}</span>
						{"\n"}
						<span className="text-foreground">{"})"}</span>
					</>
				)}
			</div>
		</div>
	)
}
