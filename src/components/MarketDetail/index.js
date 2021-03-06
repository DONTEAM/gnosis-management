import React, { Component } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import 'moment-duration-format'
import autobind from 'autobind-decorator'
import cn from 'classnames'
import Decimal from 'decimal.js'
import { calcLMSRProfit } from 'api'

import { RESOLUTION_TIME, GAS_COST, MARKET_STAGES } from 'utils/constants'
import { marketShape } from 'utils/shapes'

import { collateralTokenToText } from 'components/CurrencyName'
import DecimalValue, { decimalToText } from 'components/DecimalValue'

import Countdown from 'components/Countdown'
import Outcome from 'components/Outcome'
import MarketGraph from 'components/MarketGraph'

import MarketBuySharesForm from 'components/MarketBuySharesForm'
import MarketResolveForm from 'components/MarketResolveForm'
import MarketMySharesForm from 'components/MarketMySharesForm'
import MarketWithdrawFeesForm from 'components/MarketWithdrawFeesForm'
// import MarketShortSellForm from 'components/MarketShortSellForm'
import MarketMyTrades from 'components/MarketMyTrades'
import config from 'config.json'

import './marketDetail.less'
import { weiToEth } from '../../utils/helpers'
import { marketShareShape } from '../../utils/shapes'

const ONE_WEEK_IN_HOURS = 168
const EXPAND_BUY_SHARES = 'buy-shares'
// const EXPAND_SHORT_SELL = 'short-sell'
const EXPAND_MY_TRADES = 'my-trades'
const EXPAND_MY_SHARES = 'my-shares'
const EXPAND_RESOLVE = 'resolve'
const EXPAND_WITHDRAW_FEES = 'withdraw-fees'

const expandableViews = {
  [EXPAND_BUY_SHARES]: {
    label: 'Buy Tokens',
    className: 'btn btn-default',
    component: MarketBuySharesForm,
    showCondition: props =>
      props.market &&
      !props.market.local &&
      props.defaultAccount &&
      props.defaultAccount !== props.market.owner &&
      !props.market.oracle.isOutcomeSet,
  },
  /* HIDDEN
  [EXPAND_SHORT_SELL]: {
    label: 'Short Sell',
    className: 'btn btn-primary',
    component: MarketShortSellForm,
    showCondition: props =>
      props.market &&
      props.defaultAccount &&
      !props.market.oracle.isOutcomeSet &&
      props.market.eventDescription.outcomes &&
      props.market.eventDescription.outcomes.length > 2,
  },*/
  [EXPAND_MY_SHARES]: {
    label: 'My Tokens',
    className: 'btn btn-default',
    component: MarketMySharesForm,
    showCondition: props => props.market && props.defaultAccount && props.defaultAccount !== props.market.owner,
  },
  [EXPAND_MY_TRADES]: {
    label: 'My Trades',
    className: 'btn btn-default',
    component: MarketMyTrades,
    showCondition: props => props.market && props.defaultAccount && props.defaultAccount !== props.market.owner,
  },
  [EXPAND_RESOLVE]: {
    label: 'Resolve',
    className: 'btn btn-default',
    component: MarketResolveForm,
    showCondition: props =>
      props.market &&
      props.defaultAccount &&
      props.defaultAccount === props.market.oracle.owner &&
      !props.market.oracle.isOutcomeSet,
  },
  [EXPAND_WITHDRAW_FEES]: {
    label: 'Withdraw fees',
    className: 'btn btn-default',
    component: MarketWithdrawFeesForm,
    showCondition: props =>
      props.market &&
      props.defaultAccount &&
      props.market.oracle.owner === props.defaultAccount &&
      new Decimal(props.market.collectedFees).gt(0),
  },
}

class MarketDetail extends Component {
  constructor(props) {
    super(props)

    this.state = {
      marketFetchError: undefined,
    }
  }

  componentWillMount() {
    this.fetchEssentialData(!this.props.params.view)
    this.fetchDataTimer = setInterval(this.fetchEssentialData, config.fetchMarketTimeInterval)
  }

  componentWillUnmount() {
    clearInterval(this.fetchDataTimer)
  }

  @autobind
  getAvailableView() {
    return Object.keys(expandableViews).find(view => expandableViews[view].showCondition(this.props))
  }

  // Check available views on first fetch
  @autobind
  fetchEssentialData(firstFetch = false) {
    this.props
      .fetchMarket()
      .then(() => {
        if (this.props.defaultAccount) {
          this.props.fetchMarketTrades(this.props.market)
          this.props.fetchMarketShares(this.props.defaultAccount)
        }
        if (firstFetch) {
          const availableView = this.getAvailableView()
          if (availableView) {
            this.props.changeUrl(`/markets/${this.props.params.id}/${availableView}`)
          }
        }
      })
      .catch((err) => {
        console.error(e)
        this.setState({
          marketFetchError: err,
        })
      })

    if (this.props.hasWallet) {
      this.props.requestGasCost(GAS_COST.BUY_SHARES)
      this.props.requestGasCost(GAS_COST.SELL_SHARES)
    }

    if (this.props.defaultAccount && this.props.params.id) {
      this.props.fetchMarketParticipantTrades(this.props.params.id, this.props.defaultAccount)
    }
  }

  @autobind
  handleExpand(view) {
    if (this.props.params.view !== view) {
      this.props.changeUrl(`/markets/${this.props.params.id}/${view}`)
    } else {
      this.props.changeUrl(`/markets/${this.props.params.id}/`)
    }
  }

  @autobind
  handleRedeemWinnings() {
    this.props.redeemWinnings(this.props.market)
  }

  renderLoading() {
    return (
      <div className="marketDetailPage">
        <div className="container">Loading...</div>
      </div>
    )
  }

  renderExpandableContent() {
    const currentView = this.props.params.view || false
    if (currentView && expandableViews[currentView] && expandableViews[currentView].component) {
      const view = expandableViews[currentView]

      if (typeof view.showCondition !== 'function' || view.showCondition(this.props)) {
        const ViewComponent = view.component
        return (
          <div className="expandable__inner">
            <div className="container">
              <ViewComponent {...this.props} />
            </div>
          </div>
        )
      }
    }

    return <div />
  }

  renderInfos(market) {
    const infos = {
      Token: collateralTokenToText(market.event.collateralToken),
      Fee: `${decimalToText(market.fee, 2) / 10000} %`,
      Funding: `${decimalToText(Decimal(market.funding).div(1e18))} ${collateralTokenToText(
        market.event.collateralToken,
      )}`,
      'Trading Volume': `${decimalToText(Decimal(market.tradingVolume).div(1e18))} ${collateralTokenToText(
        market.event.collateralToken,
      )}`,
    }
    const showWithdrawFees =
      this.props.defaultAccount &&
      market.oracle.owner === this.props.defaultAccount &&
      new Decimal(market.collectedFees).gt(0)

    if (this.props.creatorIsModerator) {
      // Show creator String
      infos.creator = this.props.moderators[market.creator]
    } else {
      // Show address
      infos.creator = market.creator
    }
    if (showWithdrawFees) {
      infos['Earnings through market fees'] = `${decimalToText(weiToEth(market.collectedFees))} ${collateralTokenToText(
        market.event.collateralToken,
      )}`
    }

    return (
      <div className="marketInfos col-xs-10 col-xs-offset-1 col-sm-3 col-sm-offset-0">
        {Object.keys(infos).map(label => (
          <div className="marketInfo" key={label}>
            <p className="marketInfo__info marketInfo__info--value">{infos[label]}</p>
            <p className="marketInfo__info marketInfo__info--label">{label}</p>
          </div>
        ))}
      </div>
    )
  }

  renderDetails(market) {
    const showWinning = market.oracle.isOutcomeSet
    const showLost = false // determine if we lost?
    const timeToResolution = moment
      .utc(market.eventDescription.resolutionDate)
      .local()
      .diff(moment(), 'hours')
    const { marketShares } = this.props

    const winnings = marketShares.reduce((sum, share) => {
      const shareWinnings = weiToEth(
        calcLMSRProfit({
          netOutcomeTokensSold: market.netOutcomeTokensSold.slice(),
          funding: market.funding,
          outcomeTokenIndex: share.outcomeToken.index,
          outcomeTokenCount: share.balance,
          feeFactor: market.fee,
        }),
      )
      return sum.plus(new Decimal(shareWinnings))
    }, new Decimal(0))

    return (
      <div className="marketDetails col-xs-10 col-xs-offset-1 col-sm-9 col-sm-offset-0">
        <div className="marketDescription">
          <p className="marketDescription__text">{market.eventDescription.description}</p>
        </div>
        <Outcome market={market} />
        {timeToResolution < ONE_WEEK_IN_HOURS ? (
          <div className="marketTimer">
            <div className="marketTimer__live">
              <Countdown target={market.eventDescription.resolutionDate} />
            </div>
            <small className="marketTime__absolute">
              {moment
                .utc(market.eventDescription.resolutionDate)
                .local()
                .format(RESOLUTION_TIME.ABSOLUTE_FORMAT)}
            </small>
          </div>
        ) : (
          <div className="marketTimer">
            <div className="marketTimer__live">
              {moment
                .utc(market.eventDescription.resolutionDate)
                .local()
                .format(RESOLUTION_TIME.ABSOLUTE_FORMAT)}
            </div>
          </div>
        )}
        {showWinning && (
          <div className="redeemWinning">
            <div className="redeemWinning__icon icon icon--achievementBadge" />
            <div className="redeemWinning__details">
              <div className="redeemWinning__heading">
                <DecimalValue value={winnings} /> {collateralTokenToText(market.event.collateralToken)}
              </div>
              <div className="redeemWinning__label">Your Winnings</div>
            </div>
            <div className="redeemWinning__action">
              <button className="btn btn-link" type="button" onClick={this.handleRedeemWinnings}>
                Redeem Winnings
              </button>
            </div>
          </div>
        )}
        {showLost && (
          <div className="redeemWinning redeemWinning--lost">
            <div className="redeemWinning__icon icon icon--cross" />
            <div className="redeemWinning__details">
              <div className="redeemWinning__heading">200 {collateralTokenToText(market.event.collateralToken)}</div>
              <div className="redeemWinning__label">You lost</div>
            </div>
          </div>
        )}
      </div>
    )
  }

  renderControls() {
    const { market, closeMarket, defaultAccount } = this.props
    return (
      <div className="marketControls container">
        <div className="row">
          {Object.keys(expandableViews)
            .filter(
              view =>
                typeof expandableViews[view].showCondition !== 'function' ||
                expandableViews[view].showCondition(this.props),
            )
            .map(view => (
              <button
                key={view}
                type="button"
                className={cn({
                  marketControls__button: true,
                  'marketControls__button--active btn btn-primary': view === this.props.params.view,
                  [expandableViews[view].className]: view !== this.props.params.view,
                })}
                onClick={() => this.handleExpand(view)}
              >
                {expandableViews[view].label}
              </button>
            ))}
          {market.stage !== MARKET_STAGES.MARKET_CLOSED &&
          market.creator === defaultAccount &&
          process.env.WHITELIST[defaultAccount] ? (
            <button
              key="close-market"
              type="button"
              className="marketControls__button btn btn-default"
              onClick={() => closeMarket(market)}
            >
              Close Market
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    )
  }

  render() {
    const { market } = this.props

    const { marketFetchError } = this.state
    if (marketFetchError) {
      return (
        <div className="marketDetailPage">
          <div className="container">This market could not be found.</div>
        </div>
      )
    }

    if (!market.address) {
      return this.renderLoading()
    }

    return (
      <div className="marketDetailPage">
        <div className="container">
          <div className="row">
            <div className="col-xs-10 col-xs-offset-1 col-sm-7 col-sm-offset-0">
              <h1 className="marketTitle__heading">{market.eventDescription.title}</h1>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="row">
            {this.renderDetails(market)}
            {this.renderInfos(market)}
          </div>
        </div>
        {this.renderControls(market)}
        <div className="expandable">{this.renderExpandableContent()}</div>
        {market.trades ? <MarketGraph data={market.trades} market={market} /> : ''}
      </div>
    )
  }
}

MarketDetail.propTypes = {
  hasWallet: PropTypes.bool,
  fetchMarketParticipantTrades: PropTypes.func,
  params: PropTypes.shape({
    id: PropTypes.string,
    view: PropTypes.string,
  }),
  marketShares: PropTypes.arrayOf(marketShareShape),
  defaultAccount: PropTypes.string,
  market: marketShape,
  changeUrl: PropTypes.func,
  fetchMarket: PropTypes.func,
  fetchMarketShares: PropTypes.func,
  fetchMarketTrades: PropTypes.func,
  redeemWinnings: PropTypes.func,
  requestGasCost: PropTypes.func,
  creatorIsModerator: PropTypes.bool,
  moderators: PropTypes.shape({
    address: PropTypes.string,
  }),
  closeMarket: PropTypes.func,
}

export default MarketDetail
