export function Content({ children }) {
	return (
		<div
			style={{
				flex: '1 1 0%'
			}}
			className='bg-white'
		>
			{/* <Header /> */}
			<section className='p-layout'>{children}</section>
		</div>
	)
}
