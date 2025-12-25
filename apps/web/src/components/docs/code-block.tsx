import { CopyButton } from "@/components/cron/copy-button"
import { codeToHtml } from "shiki"

type CodeBlockProps = {
	code: string
	language?: string
	label?: string
}

export async function CodeBlock({
	code,
	language = "typescript",
	label,
}: CodeBlockProps) {
	const html = await codeToHtml(code, {
		lang: language,
		theme: "vitesse-dark",
	})

	return (
		<div className="docs-code-block">
			{label && (
				<div className="docs-code-header">
					<span className="docs-code-label">{label}</span>
					<CopyButton text={code} />
				</div>
			)}
			<div className="docs-code-content relative">
				{!label && (
					<div className="absolute top-0 right-0 z-10">
						<CopyButton text={code} />
					</div>
				)}
				<div
					className="[&>pre]:!bg-transparent [&>pre]:!p-0 [&>pre]:!m-0 [&_.line]:leading-relaxed"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output is trusted
					dangerouslySetInnerHTML={{ __html: html }}
				/>
			</div>
		</div>
	)
}
