"use client"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import { isLimitExceeded } from "@/lib/api"
import type { ApiKey } from "@/lib/api"
import { formatRelativeCompactAgo } from "@/lib/format"
import { useCreateApiKey, useDeleteApiKey } from "@/lib/query"
import { Check, Copy, Loader2, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type ApiKeyTableProps = {
	apiKeys: ApiKey[]
	projectId: string
}

export function ApiKeyTable({ apiKeys, projectId }: ApiKeyTableProps) {
	const [showCreate, setShowCreate] = useState(false)
	const [newKeyName, setNewKeyName] = useState("")
	const [createdKey, setCreatedKey] = useState<string | null>(null)
	const [copied, setCopied] = useState(false)
	const [deletingKey, setDeletingKey] = useState<ApiKey | null>(null)
	const [showUpgrade, setShowUpgrade] = useState(false)

	const createApiKey = useCreateApiKey()
	const deleteApiKey = useDeleteApiKey()

	function handleCreate(e: React.FormEvent) {
		e.preventDefault()
		createApiKey.mutate(
			{ projectId, data: { name: newKeyName } },
			{
				onSuccess: (data) => {
					setCreatedKey(data.fullKey)
					setNewKeyName("")
				},
				onError: (error) => {
					if (isLimitExceeded(error)) {
						setShowCreate(false)
						setShowUpgrade(true)
					} else {
						toast.error(error.message)
					}
				},
			},
		)
	}

	function handleCopy() {
		if (createdKey) {
			navigator.clipboard.writeText(createdKey)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		}
	}

	function handleCloseCreate() {
		setShowCreate(false)
		setCreatedKey(null)
		setNewKeyName("")
	}

	function handleDelete() {
		if (!deletingKey) return
		deleteApiKey.mutate(
			{ projectId, apiKeyId: deletingKey.id },
			{
				onSuccess: () => {
					toast.success("API key deleted")
					setDeletingKey(null)
				},
				onError: (error) => toast.error(error.message),
			},
		)
	}

	return (
		<>
			<div className="flex justify-end mb-4">
				<Button onClick={() => setShowCreate(true)}>
					<Plus className="h-4 w-4 mr-2" />
					New API key
				</Button>
			</div>

			{apiKeys.length === 0 ? (
				<div className="text-center py-12 text-muted-foreground">
					No API keys yet. Create one to authenticate ping requests.
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Key</TableHead>
							<TableHead>Last Used</TableHead>
							<TableHead>Created</TableHead>
							<TableHead className="w-12" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{apiKeys.map((apiKey) => (
							<TableRow key={apiKey.id}>
								<TableCell className="font-medium">{apiKey.name}</TableCell>
								<TableCell className="font-mono text-sm text-muted-foreground">
									{apiKey.keyPrefix}...
								</TableCell>
								<TableCell className="text-sm text-muted-foreground">
									{apiKey.lastUsedAt
										? formatRelativeCompactAgo(apiKey.lastUsedAt)
										: "Never"}
								</TableCell>
								<TableCell className="text-sm text-muted-foreground">
									{formatRelativeCompactAgo(apiKey.createdAt)}
								</TableCell>
								<TableCell>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => setDeletingKey(apiKey)}
										className="text-destructive hover:text-destructive"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			<Dialog open={showCreate} onOpenChange={handleCloseCreate}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{createdKey ? "API key created" : "Create API key"}
						</DialogTitle>
						<DialogDescription>
							{createdKey
								? "Make sure to copy your API key now. You won't be able to see it again."
								: "Create a new API key for this project."}
						</DialogDescription>
					</DialogHeader>

					{createdKey ? (
						<div className="flex items-center gap-2">
							<Input
								value={createdKey}
								readOnly
								className="font-mono text-sm"
							/>
							<Button variant="outline" size="icon" onClick={handleCopy}>
								{copied ? (
									<Check className="h-4 w-4" />
								) : (
									<Copy className="h-4 w-4" />
								)}
							</Button>
						</div>
					) : (
						<form onSubmit={handleCreate}>
							<div className="space-y-4">
								<Label htmlFor="key-name">Name</Label>
								<Input
									id="key-name"
									value={newKeyName}
									onChange={(e) => setNewKeyName(e.target.value)}
									placeholder="Production key"
									required
								/>
							</div>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={handleCloseCreate}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={createApiKey.isPending}>
									{createApiKey.isPending && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Create
								</Button>
							</DialogFooter>
						</form>
					)}

					{createdKey && (
						<DialogFooter>
							<Button onClick={handleCloseCreate}>Done</Button>
						</DialogFooter>
					)}
				</DialogContent>
			</Dialog>

			<ConfirmDialog
				open={!!deletingKey}
				onOpenChange={(open) => !open && setDeletingKey(null)}
				title="Delete API key"
				description={`Are you sure you want to delete "${deletingKey?.name}"? This cannot be undone.`}
				confirmLabel="Delete"
				variant="destructive"
				onConfirm={handleDelete}
			/>

			<UpgradeDialog
				open={showUpgrade}
				onOpenChange={setShowUpgrade}
				resource="API keys"
				limit={1}
			/>
		</>
	)
}
