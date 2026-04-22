<div class="legend">
    <div class="legend-item">
        <span class="dot" style="background: #ef4444"></span> Low (0-24%)
    </div>
    <div class="legend-item">
        <span class="dot" style="background: #f97316"></span> Medium (25-49%)
    </div>
    <div class="legend-item">
        <span class="dot" style="background: #f59e0b"></span> High (50-74%)
    </div>
    <div class="legend-item">
        <span class="dot" style="background: #22c55e"></span> Elite (75-100%)
    </div>
    <div class="legend-separator"></div>
    <div class="legend-item">
        <span class="box solid"></span> Manual Mode
    </div>
    <div class="legend-item">
        <span class="box dashed"></span> Auto (PageRank)
    </div>
</div>

<style lang="scss">
    .legend {
        position: absolute;
        bottom: 24px;
        left: 24px;
        background: white;
        padding: 12px 20px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        z-index: 50;
    }
    .legend-item {
        display: flex;
        align-items: center;
        font-size: 0.7rem;
        font-weight: 600;
        color: #64748b;
    }
    .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 8px;
    }
    .legend-separator {
        height: 1px;
        background: #f1f5f9;
        margin: 4px 0;
    }
    .box {
        width: 12px;
        height: 12px;
        margin-right: 8px;
        border: 2px solid #cbd5e1;
        border-radius: 3px;

        &.solid {
            border-style: solid;
        }
        &.dashed {
            border-style: dashed;
        }
    }
</style>
