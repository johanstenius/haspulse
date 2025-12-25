"use client"

import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react"
import { type Organization, api, getCurrentOrgId, setCurrentOrgId } from "./api"

type OrgContextValue = {
	organizations: Organization[]
	currentOrg: Organization | null
	isLoading: boolean
	switchOrg: (orgId: string) => void
	refetch: () => Promise<void>
}

const OrgContext = createContext<OrgContextValue | null>(null)

export function OrgProvider({ children }: { children: ReactNode }) {
	const [organizations, setOrganizations] = useState<Organization[]>([])
	const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const fetchOrgs = useCallback(async () => {
		try {
			const { organizations: orgs } = await api.organizations.list()
			setOrganizations(orgs)

			// Auto-select org
			const savedOrgId = getCurrentOrgId()
			const savedOrg = orgs.find((o) => o.id === savedOrgId)

			if (savedOrg) {
				setCurrentOrg(savedOrg)
			} else if (orgs.length > 0) {
				setCurrentOrg(orgs[0])
				setCurrentOrgId(orgs[0].id)
			}
		} catch (error) {
			console.error("Failed to fetch organizations:", error)
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchOrgs()
	}, [fetchOrgs])

	const switchOrg = useCallback(
		(orgId: string) => {
			const org = organizations.find((o) => o.id === orgId)
			if (org) {
				setCurrentOrg(org)
				setCurrentOrgId(orgId)
			}
		},
		[organizations],
	)

	return (
		<OrgContext.Provider
			value={{
				organizations,
				currentOrg,
				isLoading,
				switchOrg,
				refetch: fetchOrgs,
			}}
		>
			{children}
		</OrgContext.Provider>
	)
}

export function useOrg() {
	const context = useContext(OrgContext)
	if (!context) {
		throw new Error("useOrg must be used within OrgProvider")
	}
	return context
}
