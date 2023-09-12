const path = require('path')

const segments = require(path.join(__dirname, 'segments.js'))
const industry = require(path.join(__dirname, 'industry.js'))
const vectors = require(path.join(__dirname, 'vectors.js'))
const factors = require(path.join(__dirname, 'factors.js'))
const accrued = require(path.join(__dirname, 'accrued.js'))

const mil = (n) => n * 1000000

class COBEstimator {
    //Above this record-threshold becomes a mega-breach 
    #threshold = mil(1) 
    //IBM Cost of Breach Report - Averages
    #avgCostOfBreach = mil(4.35)
    #avgCostOfMegaBreach = mil(387)
    #avgTimeToIdentify = 207
    #avgTimeToContain = 70
    #avgCostOfRecord = 164
    #avgCostOfShortLifecycle = mil(3.74)
    #avgCostOfLongLifecycle = mil(4.86)
    //Internal settings object
    #settings = { industry:null, vector:null, factors:[], regulated:false }

    constructor(options={}) {
        this.costIn  = Number(options.cost) || 0    //Estimated cost of breach
        this.countIn = Number(options.count) || 0   //Estimated count of PII records 
        
        this.costOfRecord = this.#avgCostOfRecord
        this.costOfBreach = this.#avgCostOfBreach 
        
        if( this.costIn ) this.costOfBreach = this.costIn
        if( this.costIn && this.countIn ) {
            this.costOfRecord = this.costOfBreach / this.countIn
        } else if( !this.costIn && this.countIn ) {
            this.costOfBreach = this.countIn > this.#threshold 
                ? this.#avgCostOfMegaBreach 
                : this.countIn * this.costOfRecord
        } 
    
    }

    segments()   { return segments }
    industries() { return industry }
    vectors()    { return vectors }
    factors()    { return factors }
    settings()   { return this.#settings }

    /**
     * Reset the interal settings object
     */
    reset() {
        this.costOfBreach = this.costIn || (this.countIn > this.#threshold ? this.#avgCostOfMegaBreach : this.#avgCostOfBreach)
        this.costOfRecord = this.#avgCostOfRecord
        this.#settings = { industry:null, vector:null, factors:[], regulated:false }
    }

    /**
     * Adjust breach cost based on the average cost of breach
     * @param {number}  cost         The cost to adjust
     * @param {number}  costOfBreach optional cost of breach override
     * @param {number}  avgCostOfBreach optional average cost of breach override
     * @return {number} adjusted cost
     */
    adjustBreach(cost, costOfBreach = this.costOfBreach, avgCostOfBreach = this.#avgCostOfBreach) {
        return Math.round(cost / avgCostOfBreach * costOfBreach)
    }

    /**
     * Adjust record cost based on the average cost of breach and record
     * @param {number}  cost         The cost to adjust
     * @param {number}  avgCostOfBreach optional average cost of breach override
     * @param {number}  avgCostOfRecord optional average cost of record
     * @return {number} adjusted cost
     */
    adjustRecord(cost, avgCostOfBreach = this.#avgCostOfBreach, avgCostOfRecord = this.#avgCostOfRecord) {
        return Math.round(cost / (avgCostOfBreach / avgCostOfRecord))
    }


    /**
     * Specify your industry for adjustments
     * @param {string} key  industry key
     * @return {this}
     */
    setIndustry(key) {
        if( key in industry ) {
            this.#settings.industry = key
            this.#settings.regulated = !!industry[key].regulated
        }
        return this
    }

    /**
     * Specify an attack vector for adjustments
     * @param {string} key  attack key
     * @return {this}
     */
    setAttackVector(key) {
        if( key in vectors ) this.#settings.vector = key
        return this
    }

    /**
     * Specify one or more security factors for adjustments
     * @param {...string} keys  factor keys
     * @return {this}
     */
    setFactor(...keys) {
        for(const key of keys) {
            if( key in factors && !this.#settings.factors.includes(key) ) {
                this.#settings.factors.push(key)
            }
        }
        return this
    }

    /**
     * Remove one or more security factors for adjustments
     * @param {...string} keys  factor keys
     * @return {this}
     */
    removeFactor(...keys) {
        for(const key of keys) {            
            const i = this.#settings.factors.findIndex(f => f === key)
            if( i >= 0 ) this.#settings.factors.splice(i,1)
        }
        return this
    }


    /**
     * Estimate the adjusted cost of breach based on
     * industry, attack vector and security factors
     * @param {object} settings     optional settings config to calculate
     * @return {object} adjusted costs and times
     */
    calculate(settings = this.#settings) {
        const adjusted = {
            costOfBreach:this.costOfBreach,
            costOfRecord:this.costOfRecord,
            timeToIdentify:this.#avgTimeToIdentify,
            timeToContain:this.#avgTimeToContain
        }

        //Beneficial cost factors
        const goodfactors = (settings.factors||[])
            .filter(k => k in factors && factors[k].impact < 0)
            .sort((a,b) => factors[a].impact - factors[b].impact)

        //Detremental cost factors
        const badfactors = (settings.factors||[])
            .filter(k => k in factors && factors[k].impact > 0)
            .sort((a,b) => factors[b].impact - factors[a].impact)

        //Adjust the average cost of breach based on breach lifecycle
        for(let f = 0; f < goodfactors.length; ++f) {
            const factor = goodfactors[f]
            adjusted.timeToIdentify += factors[factor].tti
            adjusted.timeToContain += factors[factor].ttc
        }
        
        for(let f = 0; f < badfactors.length; ++f) {
            const factor = badfactors[f]
            adjusted.timeToIdentify += factors[factor].tti
            adjusted.timeToContain += factors[factor].ttc
        }

        const avgCostOfBreach = (adjusted.timeToIdentify + adjusted.timeToContain) > 200 
            ? this.#avgCostOfLongLifecycle
            : this.#avgCostOfShortLifecycle
    
        //Industry
        if( settings.industry?.length && settings.industry in industry ) {
            adjusted.costOfBreach = this.adjustBreach(industry[settings.industry].impact, adjusted.costOfBreach, avgCostOfBreach)
            adjusted.costOfRecord = this.adjustRecord(industry[settings.industry].impact, avgCostOfBreach)
        }
        
        //Attack vector
        if( settings.vector?.length && settings.vector in vectors ) {
            adjusted.costOfBreach = this.adjustBreach(vectors[settings.vector].impact, adjusted.costOfBreach, avgCostOfBreach)
            adjusted.timeToIdentify = vectors[settings.vector].tti
            adjusted.timeToContain = vectors[settings.vector].ttc
        }

        for(let f = 0; f < goodfactors.length; ++f) {
            const factor = goodfactors[f]
            const impact = factors[factor].impact / (f+1)
            adjusted.costOfBreach += this.adjustBreach(impact, adjusted.costOfBreach, avgCostOfBreach)
        }
        
        for(let f = 0; f < badfactors.length; ++f) {
            const factor = badfactors[f]
            const impact = factors[factor].impact / (f+1)
            adjusted.costOfBreach += this.adjustBreach(impact, adjusted.costOfBreach, avgCostOfBreach)
        }

        return adjusted
    }

    /**
     * Estimate the cost of breach broken out across one or more cost-segments
     * @param {number}  costOfBreach    optional cost of breach override    
     * @return {object} one or more estimated segment costs
     */
    getSegments(costOfBreach = this.costOfBreach) {
        return Object.keys(segments).reduce((acc,k) => { 
            acc[segments[k].label] = this.adjustBreach(segments[k].impact, costOfBreach); 
            return acc 
        },{ Total:Math.round(costOfBreach) })
    }

    /**
     * Estimate the cost of breach broken out across years accrued
     * @param {number}  costOfBreach    optional cost of breach override    
     * @return {object} one or more estimated years
     */
    getAccrued(costOfBreach = this.costOfBreach) {
        const accruedKey = this.#settings.regulated ? 'regulated' : 'unregulated'
        return {
            'Total': costOfBreach,
            '1st Year': Math.round(costOfBreach * accrued[accruedKey][0]),
            '2nd Year': Math.round(costOfBreach * accrued[accruedKey][1]),
            '2+ Years': Math.round(costOfBreach * accrued[accruedKey][2])
        }
    }
    
}

module.exports = COBEstimator
