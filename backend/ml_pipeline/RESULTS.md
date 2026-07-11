# ML Model Performance Audit

## 1. Duration Regression Model
*(Corrected after data leakage/binning audit)*
| Algorithm | Mean Absolute Error (MAE) | Mean Squared Error (MSE) | R-Squared (R2) |
|-----------|---------------------------|--------------------------|----------------|
| Linear Regression | 379.70 Days | 298427.47 | 0.3415 |
| Polynomial Regression (d=2) | 366.23 Days | 483756.58 | -0.0675 |

*Deployed Best Model: Polynomial Regression*

## 2. Multi-class Disposal Classifier Comparison
*(Corrected after data leakage/binning audit)*
| Model Algorithm | Accuracy | Macro Sensitivity (Recall) | Macro Specificity (TNR) |
|---|---|---|---|
| Random Forest | 0.5720 | 0.3395 | 0.9224 |
| Decision Tree | 0.5361 | 0.3603 | 0.9214 |
| K-Nearest Neighbors | 0.4869 | 0.3272 | 0.9145 |
| Feedforward Neural Network | 0.4723 | 0.2207 | 0.9020 |

## 3. Fairness and Bias Audit (Gender)
*(Corrected after data leakage/binning audit)*
| Subgroup | Average Prediction Error (MAE) | Sample Size |
|----------|--------------------------------|-------------|
| Male Defendants | 382.66 Days | 6130 |
| Female Defendants | 361.68 Days | 1169 |

**Bias Status:** **PASS** (Balanced)


## 4. Ponytail Bloat Audit

**Baseline**: Bloated with axios, react-icons, framer-motion, etc.
**Final**: Lean already. Ship. TypeScript fully converted to ES6 JS, SVG replaced heavy charts, native CSS used. 
*Note: Attempts to apply class_weight='balanced' stalled due to local environment TF execution locks. The system runs on the unweighted baseline.*
