// 代币发现趋势图 - 柱状图版本
tokenDiscoveryChart = new Chart(tokenChartCtx, {
    type: 'bar',  // 改为柱状图，更适合显示趋势数据
    data: {
        labels: [], // 将在更新数据时填充
        datasets: [{
            label: '发现代币数',
            data: [],
            backgroundColor: '#bd4dff',
            borderColor: '#bd4dff',
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.6
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(30, 33, 48, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 6
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: themes.dark.tickColor
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    precision: 0,
                    color: themes.dark.tickColor
                }
            }
        }
    }
});

// 利润趋势图 - 柱状图版本
profitTrendChart = new Chart(profitChartCtx, {
    type: 'bar',
    data: {
        labels: [], // 将在更新数据时填充
        datasets: [{
            label: '收益 (SOL)',
            data: [],
            backgroundColor: '#36a2eb',
            borderColor: '#36a2eb',
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.6
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(30, 33, 48, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 6,
                callbacks: {
                    label: function(context) {
                        return `收益: ${context.raw.toFixed(2)} SOL`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: themes.dark.tickColor
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    callback: function(value) {
                        return value.toFixed(2);
                    },
                    color: themes.dark.tickColor
                }
            }
        }
    }
}); 