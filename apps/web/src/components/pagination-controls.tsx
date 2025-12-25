"use client"

import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination"

type PaginationControlsProps = {
	page: number
	totalPages: number
	onPageChange: (page: number) => void
}

function getPageNumbers(
	currentPage: number,
	totalPages: number,
): (number | "ellipsis-left" | "ellipsis-right")[] {
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, i) => i + 1)
	}

	const pages: (number | "ellipsis-left" | "ellipsis-right")[] = []
	pages.push(1)

	if (currentPage > 3) {
		pages.push("ellipsis-left")
	}

	for (
		let i = Math.max(2, currentPage - 1);
		i <= Math.min(totalPages - 1, currentPage + 1);
		i++
	) {
		pages.push(i)
	}

	if (currentPage < totalPages - 2) {
		pages.push("ellipsis-right")
	}

	pages.push(totalPages)
	return pages
}

export function PaginationControls({
	page,
	totalPages,
	onPageChange,
}: PaginationControlsProps) {
	if (totalPages <= 1) return null

	const pageNumbers = getPageNumbers(page, totalPages)

	return (
		<Pagination className="mt-4">
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						onClick={() => page > 1 && onPageChange(page - 1)}
						className={
							page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
						}
					/>
				</PaginationItem>
				{pageNumbers.map((p) =>
					typeof p === "string" ? (
						<PaginationItem key={p}>
							<PaginationEllipsis />
						</PaginationItem>
					) : (
						<PaginationItem key={p}>
							<PaginationLink
								isActive={p === page}
								onClick={() => onPageChange(p)}
								className="cursor-pointer"
							>
								{p}
							</PaginationLink>
						</PaginationItem>
					),
				)}
				<PaginationItem>
					<PaginationNext
						onClick={() => page < totalPages && onPageChange(page + 1)}
						className={
							page >= totalPages
								? "pointer-events-none opacity-50"
								: "cursor-pointer"
						}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	)
}
