# COBEstimator
Estimate your cost of a data breach based on the findings in the IBM Cost of a Data Breach report 

Current report: 2022

Initial cost of breach is calculated against the average cost per record, or scaled against the average cost of a data breach

```js
const { COBEstimator } = await import(cobLibPath)

//Using a count of all PII records
const costOfBreach = new COBEstimator({ count:1000 })

//Using an estimated breach cost
const costOfBreach = new COBEstimator({ cost:1000000 })
```

## Adjusting the estimate using cost factors

- **Industries** : The industry to which your organization belongs
- **Attack Vectors** : Potential attack vector of concern
- **Security Factors** : Potential (negative or positive) security factors 

```js
const costOfBreach = new COBEstimator({ cost:1000000 })

costOfBreach.setIndustry('entertainment')
costOfBreach.setAttackVector('vulnerability')
costOfBreach.setFactor('encryption','insurance','skills')

const adjusted = costOfBreach.calculate()
//> {
//>   costOfBreach: 711257,
//>   costOfRecord: 129,
//>   timeToIdentify: 214,
//>   timeToContain: 70
//> }
```

Optionally remove one or more security factors

```js
costOfBreach.removeFactor('skills')
```

Note: *Setters are also chainable*

```js
const adjusted = new COBEstimator({ cost:1000000 })
    .setIndustry('entertainment')
    .setAttackVector('vulnerability')
    .setFactor('encryption','insurance','skills')
    .calculate()
```

## Estmate the cost breakdown 

Estimate across cost-segments 

```js
const segmentation = costOfBreach.getSegments(adjusted.costOfBreach)
//> {
//>   'Total': 711257,
//>   'Notification': 50687,
//>   'Post Breach Response': 192939,
//>   'Detection and Escalation': 235451,
//>   'Lost Business': 232180
//> }
```

Estimate per annum

```js
const perannum = costOfBreach.getAccrued(adjusted.costOfBreach)
//> { 
//>     'Total':711257,
//>     '1st Year': 469430, 
//>     '2nd Year': 184927, 
//>     '2+ Years': 56901 
//> }
```

## Accessing the core data

```js
const { industries, vectors, factors, segments } = await import(cobLibPath)
```
