import os
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from train_model import fetch_data

def run_eda():
    print("Starting Exploratory Data Analysis...")
    
    # Create artifacts directory if not exists
    artifacts_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'artifacts')
    os.makedirs(artifacts_dir, exist_ok=True)
    
    # 1. Fetch data
    df = fetch_data()
    print(f"Loaded {len(df)} records for EDA.")
    
    sns.set_theme(style="whitegrid")
    
    # 2. Boxplot: Case duration by Category
    print("Generating Boxplot (Case duration by Category)...")
    plt.figure(figsize=(10, 6))
    # Filter extreme outliers for better visualization
    df_filtered = df[df['days_since_filing'] < df['days_since_filing'].quantile(0.95)]
    sns.boxplot(x='case_category', y='days_since_filing', data=df_filtered, palette='Set2')
    plt.title('Distribution of Case Duration by Category (excluding top 5% outliers)')
    plt.ylabel('Days Since Filing')
    plt.xlabel('Case Category')
    plt.tight_layout()
    plt.savefig(os.path.join(artifacts_dir, 'boxplot_duration_by_category.png'))
    plt.close()
    
    # 3. Heatmap: Correlation between numeric variables
    print("Generating Heatmap (Correlation)...")
    numeric_cols = ['days_since_filing', 'num_parties', 'num_hearings', 'is_disposed', 'is_disposed_12m']
    corr = df[numeric_cols].corr()
    
    plt.figure(figsize=(8, 6))
    sns.heatmap(corr, annot=True, cmap='coolwarm', fmt=".2f", vmin=-1, vmax=1)
    plt.title('Correlation Heatmap of Numeric Features')
    plt.tight_layout()
    plt.savefig(os.path.join(artifacts_dir, 'heatmap_correlation.png'))
    plt.close()
    
    # 4. Filing Trends: Time Series of Case Filings
    print("Generating Filing Trends (Time Series)...")
    # Group by Year-Month
    df['filing_year_month'] = df['date_of_filing'].dt.to_period('M')
    filing_trends = df.groupby('filing_year_month').size().reset_index(name='count')
    filing_trends['filing_year_month'] = filing_trends['filing_year_month'].dt.to_timestamp()
    
    plt.figure(figsize=(12, 6))
    sns.lineplot(x='filing_year_month', y='count', data=filing_trends, marker='o', color='royalblue')
    plt.title('Monthly Case Filing Trends (Gujarat)')
    plt.ylabel('Number of Cases Filed')
    plt.xlabel('Date')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(os.path.join(artifacts_dir, 'filing_trends.png'))
    plt.close()
    
    print(f"EDA successfully completed. Visualizations saved in {artifacts_dir}")

if __name__ == '__main__':
    run_eda()
