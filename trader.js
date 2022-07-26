import { numToString, log, stringify, getDate } from 'all.js'

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL")
	ns.clearLog()
	ns.tail()

	let stockSymbols = ns.stock.getSymbols()
	let portfolio = []
	let stats = { start: 0, profit: 0 }
	const BUY_FC_THRESH = 0.65
	const SELL_FC_THRESH = 0.5
	const PROFIT_THRESH = 2.5
	const STOP_LOSS = 0.4
	const SPEND_RATIO = 0.25

	stats.start = getDate()

	for (const stock of stockSymbols) {
		let pos = ns.stock.getPosition(stock)
		if (pos[0] > 0) {
			portfolio.push({ sym: stock, value: pos[1], shares: pos[0] })
			stats.profit -= Number.parseInt(pos[1] * pos[0])
		}
	}

	while (true) {
		ns.clearLog()

		if (ns.getServerMoneyAvailable('home') < 60e3) continue

		for (const stock of stockSymbols) {
			if (portfolio.findIndex(obj => obj.sym === stock) !== -1) {
				let i = portfolio.findIndex(obj => obj.sym === stock)

				if (ns.stock.getAskPrice(stock) >= portfolio[i].value * PROFIT_THRESH)
					sellStock(stock)
				else if (ns.stock.getForecast(stock) < STOP_LOSS)
					sellStock(stock)

			}
			else if (ns.stock.getForecast(stock) >= BUY_FC_THRESH) {
				buyStock(stock)
			}
		}

		stats.portfolio = portfolio.map(s => `${s.sym} ${(s.value * s.shares).toFixed(0)}`)
		log(ns, "w", `${stringify(stats)}`)

		await ns.sleep(60e3)
	}

	function buyStock(stock) {
		let price = ns.stock.getAskPrice(stock).toFixed(0)
		let quantity = stockBuyQuantCalc(price, stock)

		if (ns.stock.getVolatility(stock) <= 0.05) {
			ns.stock.buyStock(stock, quantity)
			log(ns, "i", `buy ${stock} for ${numToString(quantity * price)}`)
			stats.profit -= Number.parseInt(quantity * price)
			portfolio.push({ sym: stock, value: price, shares: quantity })
		}
	}

	function sellStock(stock) {
		let pos = ns.stock.getPosition(stock)
		let forecast = ns.stock.getForecast(stock)
		if (forecast < SELL_FC_THRESH) {
			let i = portfolio.findIndex(obj => obj.sym === stock)
			portfolio.splice(i, 1)
			let stockPrice = ns.stock.sellStock(stock, pos[0])
			stats.profit += Number.parseInt(stockPrice * pos[0])
			log(ns, "i", `sell ${stock} for ${numToString(pos[1] * pos[0])}`)
		}
	}

	function stockBuyQuantCalc(stockPrice, stock) {
		let playerMoney = ns.getServerMoneyAvailable('home')
		let maxSpend = playerMoney * SPEND_RATIO
		let calcShares = maxSpend / stockPrice
		let maxShares = ns.stock.getMaxShares(stock)

		if (calcShares > maxShares)
			return maxShares
		else
			return calcShares
	}
}