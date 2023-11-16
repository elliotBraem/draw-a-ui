/* eslint-disable react-hooks/rules-of-hooks */
'use client'

import { useBreakpoint } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import dynamic from 'next/dynamic'
import { PreviewShapeUtil } from './PreviewShape/PreviewShape'
import { APIKeyInput } from './components/APIKeyInput'
import { ExportButton } from './components/ExportButton'

const Tldraw = dynamic(async () => (await import('@tldraw/tldraw')).Tldraw, {
	ssr: false,
})

const shapeUtils = [PreviewShapeUtil]

export default function Home() {
	return (
		<>
			<div className={'tldraw__editor'}>
				<Tldraw
					persistenceKey="tldraw"
					shapeUtils={shapeUtils}
					shareZone={<ExportButton />}
				>
					<APIKeyInput />
					<LockupLink />
				</Tldraw>
			</div>
		</>
	)
}

function LockupLink() { // whoa what is this
	const breakpoint = useBreakpoint()
	return (
		<a
			className={`lockup__link ${breakpoint < 5 ? 'lockup__link__mobile' : ''}`}
			href="https://www.tldraw.dev"
		>
			<img
				className="lockup"
				src="/lockup.svg"
				style={{ padding: 8, height: 40 }}
			/>
		</a>
	)
}
