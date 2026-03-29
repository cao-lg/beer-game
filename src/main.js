import './style.css'
import { Chart, registerables } from 'chart.js';
import {
  initGameState,
  processPlayerOrder,
  processAINodes,
  processCycle,
  isGameOver,
  getGameResults
} from './supplyChainAlgorithm.js';

Chart.register(...registerables);

// 游戏状态
let gameState = {
  supplyChainLength: 4,
  nodes: [],
  currentCycle: 0,
  totalCycles: 30,
  inventoryCost: 0.5,
  shortageCost: 1.0,
  informationMode: 'opaque',
  aiStrategy: 'simple',
  demandType: 'stable',
  playerNodeIndex: 3,
  marketDemand: [],
  totalCost: 0,
  orderHistory: [],
  inventoryHistory: [],
  backlogHistory: [],
  charts: {}
};

const nodeTypes = ['生产商', '分销商', '批发商', '零售商'];

// 初始化
function init() {
  initEventListeners();
  updateNodeTypes();
}

// 事件监听
function initEventListeners() {
  // 供应链长度变化
  document.getElementById('supply-chain-length').addEventListener('change', updateNodeTypes);
  
  // 开始游戏
  document.getElementById('start-game').addEventListener('click', startGame);
  
  // 重新开始
  document.getElementById('restart-game').addEventListener('click', restartGame);
  
  // 提交订单
  document.getElementById('submit-order').addEventListener('click', submitOrder);
  
  // 订单数量调整
  document.querySelectorAll('.btn-adjust').forEach(btn => {
    btn.addEventListener('click', adjustOrderQuantity);
  });
  
  // 快速下单
  document.querySelectorAll('.btn-quick').forEach(btn => {
    btn.addEventListener('click', quickOrder);
  });
  
  // 帮助弹窗
  document.getElementById('help-btn').addEventListener('click', showHelp);
  document.querySelector('.modal-close').addEventListener('click', hideHelp);
  document.getElementById('help-modal').addEventListener('click', (e) => {
    if (e.target.id === 'help-modal') hideHelp();
  });
  
  // 导出数据
  document.getElementById('export-data').addEventListener('click', exportData);
  
  // 生成海报
  document.getElementById('generate-poster').addEventListener('click', generatePoster);
  
  // 下载海报
  document.getElementById('download-poster').addEventListener('click', downloadPoster);
  
  // 海报模态框关闭
  const posterClose = document.querySelector('#poster-modal .modal-close');
  if (posterClose) {
    posterClose.addEventListener('click', () => {
      document.getElementById('poster-modal').style.display = 'none';
    });
  }
  document.getElementById('poster-modal').addEventListener('click', (e) => {
    if (e.target.id === 'poster-modal') {
      document.getElementById('poster-modal').style.display = 'none';
    }
  });
}

// 更新节点类型
function updateNodeTypes() {
  const length = parseInt(document.getElementById('supply-chain-length').value);
  const container = document.getElementById('node-types-container');
  const playerSelect = document.getElementById('player-node');
  
  container.innerHTML = '';
  playerSelect.innerHTML = '';
  
  for (let i = 0; i < length; i++) {
    const nodeType = nodeTypes[Math.min(i, nodeTypes.length - 1)];
    
    // 节点类型选择
    const item = document.createElement('div');
    item.className = 'node-type-item';
    item.innerHTML = `
      <label>节点${i + 1}</label>
      <select id="node-type-${i}">
        ${nodeTypes.map(t => `<option value="${t}" ${t === nodeType ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
    `;
    container.appendChild(item);
    
    // 玩家选择
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `${nodeType} (节点${i + 1})`;
    playerSelect.appendChild(option);
  }
}

// 开始游戏
function startGame() {
  // 读取配置
  const supplyChainLength = parseInt(document.getElementById('supply-chain-length').value);
  const totalCycles = parseInt(document.getElementById('game-cycles').value);
  const initialInventory = parseInt(document.getElementById('initial-inventory').value);
  const safetyStock = parseInt(document.getElementById('safety-stock').value);
  const orderDelay = parseInt(document.getElementById('order-delay').value);
  const logisticsDelay = parseInt(document.getElementById('logistics-delay').value);
  const demandType = document.getElementById('demand-type').value;
  
  // 初始化游戏状态
  const newState = initGameState({
    supplyChainLength,
    initialInventory,
    safetyStock,
    orderDelay,
    logisticsDelay,
    totalCycles,
    demandType
  });
  // 保留charts属性
  newState.charts = gameState.charts || {};
  gameState = newState;
  
  // 设置其他参数
  gameState.inventoryCost = parseFloat(document.getElementById('inventory-cost').value);
  gameState.shortageCost = parseFloat(document.getElementById('shortage-cost').value);
  gameState.informationMode = document.getElementById('information-mode').value;
  gameState.aiStrategy = document.getElementById('ai-strategy').value;
  gameState.playerNodeIndex = parseInt(document.getElementById('player-node').value);
  
  // 自定义节点类型
  for (let i = 0; i < gameState.supplyChainLength; i++) {
    gameState.nodes[i].type = document.getElementById(`node-type-${i}`).value;
  }
  
  // 切换页面
  showPage('game-section');
  
  // 更新显示
  updateGameStatus();
  updateNodeStatus();
  initGameChart();
}



// 更新游戏状态
function updateGameStatus() {
  document.getElementById('current-cycle').textContent = gameState.currentCycle;
  document.getElementById('total-cycles').textContent = gameState.totalCycles;
  document.getElementById('total-inventory').textContent = 
    gameState.nodes.reduce((sum, node) => sum + node.inventory, 0);
  document.getElementById('total-cost').textContent = gameState.totalCost.toFixed(0);
  document.getElementById('current-demand').textContent = 
    gameState.currentCycle < gameState.totalCycles ? gameState.marketDemand[gameState.currentCycle] : '-';
}

// 更新节点状态
function updateNodeStatus() {
  const container = document.getElementById('node-status');
  container.innerHTML = '';
  
  gameState.nodes.forEach((node, index) => {
    const isPlayer = index === gameState.playerNodeIndex;
    const item = document.createElement('div');
    item.className = `node-status-item ${isPlayer ? 'player' : ''}`;
    item.innerHTML = `
      <h4>${node.type}${isPlayer ? ' 👤' : ''}</h4>
      <div class="node-value">${node.inventory}</div>
      <div class="node-detail">缺货: ${node.backlog} | 成本: ${node.cost.toFixed(0)}</div>
    `;
    container.appendChild(item);
  });
}

// 调整订单数量
function adjustOrderQuantity(e) {
  const input = document.getElementById('order-quantity');
  let value = parseInt(input.value) || 0;
  
  if (e.target.dataset.action === 'increase') {
    value += 1;
  } else if (e.target.dataset.action === 'decrease') {
    value = Math.max(0, value - 1);
  }
  
  input.value = value;
}

// 快速下单
function quickOrder(e) {
  const input = document.getElementById('order-quantity');
  const currentValue = parseInt(input.value) || 0;
  const addValue = parseInt(e.target.dataset.value);
  input.value = currentValue + addValue;
}

// 提交订单
function submitOrder() {
  const quantity = parseInt(document.getElementById('order-quantity').value) || 0;
  
  // 玩家订单
  processPlayerOrder(gameState, quantity);
  
  // AI订单 - 按零售商→批发商→分销商的顺序处理
  processAINodes(gameState);
  
  // 处理周期
  const updatedState = processCycle(gameState);
  // 保留charts属性
  updatedState.charts = gameState.charts;
  gameState = updatedState;
  
  // 更新显示
  updateGameStatus();
  updateNodeStatus();
  updateGameChart();
  
  // 检查结束
  if (isGameOver(gameState)) {
    showResults();
  }
}





// 初始化游戏图表
function initGameChart() {
  const ctx = document.getElementById('game-chart');
  if (!ctx) return;
  
  if (gameState.charts.game) {
    gameState.charts.game.destroy();
  }
  
  // 准备数据集
  const datasets = [];
  
  // 添加需求数据
  datasets.push({
    label: '需求',
    data: [0],
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    tension: 0.4,
    borderWidth: 2
  });
  
  // 添加每个节点的库存数据
  gameState.nodes.forEach((node, index) => {
    const colors = ['#6366f1', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];
    const color = colors[index % colors.length];
    
    datasets.push({
      label: node.type,
      data: [node.inventory],
      borderColor: color,
      backgroundColor: 'transparent',
      tension: 0.4,
      borderWidth: 2
    });
  });
  
  gameState.charts.game = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['开始'],
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { 
            boxWidth: 10, 
            font: { size: 10 },
            padding: 8,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        }
      },
      scales: {
        y: { 
          beginAtZero: true, 
          grid: { color: '#f1f5f9' },
          ticks: { font: { size: 10 } }
        },
        x: { 
          grid: { display: false },
          ticks: { font: { size: 10 } }
        }
      }
    }
  });
}

// 更新游戏图表
function updateGameChart() {
  if (!gameState.charts.game) return;
  
  const chart = gameState.charts.game;
  const labels = Array.from({length: gameState.currentCycle + 1}, (_, i) => `周期${i}`);
  
  chart.data.labels = labels;
  
  // 更新需求数据
  chart.data.datasets[0].data = [0, ...gameState.marketDemand.slice(0, gameState.currentCycle)];
  
  // 更新每个节点的库存数据
  gameState.nodes.forEach((node, index) => {
    chart.data.datasets[index + 1].data = gameState.inventoryHistory[index];
  });
  
  chart.update('none');
}

// 显示结果
function showResults() {
  showPage('results-section');
  
  // 更新结果摘要
  document.getElementById('result-total-cost').textContent = gameState.totalCost.toFixed(0);
  document.getElementById('result-avg-cost').textContent = (gameState.totalCost / gameState.totalCycles).toFixed(1);
  
  // 节点详情
  const summaryDiv = document.getElementById('results-summary');
  summaryDiv.innerHTML = gameState.nodes.map((node, i) => `
    <div class="node-result-item">
      <span>${node.type}${i === gameState.playerNodeIndex ? ' 👤' : ''}</span>
      <span>${node.cost.toFixed(0)}</span>
    </div>
  `).join('');
  
  // 生成牛鞭效应图表
  generateBullwhipChart();
  
  // 生成数据表格
  generateDataTable();
  
  // 生成建议
  generateSuggestions();
}

// 生成数据表格
function generateDataTable() {
  const table = document.getElementById('game-data-table');
  if (!table) return;
  
  // 构建表格头部
  let headers = '<tr><th>周期</th><th>市场需求</th>';
  gameState.nodes.forEach((node, index) => {
    headers += `
      <th colspan="3">${node.type}${index === gameState.playerNodeIndex ? ' 👤' : ''}</th>
    `;
  });
  headers += '</tr><tr><th></th><th></th>';
  gameState.nodes.forEach(() => {
    headers += '<th>库存</th><th>缺货</th><th>订单</th>';
  });
  headers += '</tr>';
  
  // 构建表格内容
  let rows = '';
  for (let cycle = 0; cycle < gameState.totalCycles; cycle++) {
    let row = `<tr><td>${cycle + 1}</td><td>${gameState.marketDemand[cycle] || '-'}</td>`;
    
    gameState.nodes.forEach((node, nodeIndex) => {
      const inventory = gameState.inventoryHistory[nodeIndex][cycle] || 0;
      const backlog = gameState.backlogHistory[nodeIndex][cycle] || 0;
      const order = gameState.orderHistory[nodeIndex][cycle] || 0;
      row += `<td>${inventory}</td><td>${backlog}</td><td>${order}</td>`;
    });
    
    row += '</tr>';
    rows += row;
  }
  
  table.innerHTML = headers + rows;
}

// 生成牛鞭效应图表
function generateBullwhipChart() {
  const ctx = document.getElementById('bullwhip-chart');
  if (!ctx) return;
  
  if (gameState.charts.bullwhip) {
    gameState.charts.bullwhip.destroy();
  }
  
  const labels = Array.from({length: gameState.totalCycles}, (_, i) => `${i + 1}`);
  
  // 计算牛鞭效应系数
  const bullwhipFactors = [];
  if (gameState.marketDemand.length > 1) {
    for (let i = 1; i < gameState.totalCycles; i++) {
      const demandChange = Math.abs(gameState.marketDemand[i] - gameState.marketDemand[i-1]);
      const orderChanges = gameState.orderHistory.map(orders => {
        if (orders[i] && orders[i-1]) {
          return Math.abs(orders[i] - orders[i-1]);
        }
        return 0;
      });
      
      bullwhipFactors.push({
        demandChange,
        orderChanges
      });
    }
  }
  
  gameState.charts.bullwhip = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: '市场需求',
        data: gameState.marketDemand,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5
      }, ...gameState.orderHistory.map((orders, i) => ({
        label: gameState.nodes[i].type,
        data: orders,
        borderColor: ['#6366f1', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'][i % 5],
        backgroundColor: 'transparent',
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 4
      }))]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, font: { size: 11 }, padding: 12 }
        },
        title: {
          display: true,
          text: '牛鞭效应展示 - 需求波动从下游到上游逐级放大',
          font: { size: 14, weight: 'bold' },
          padding: { top: 10, bottom: 20 }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            afterTitle: function(tooltipItems) {
              if (tooltipItems.length > 0) {
                const index = tooltipItems[0].dataIndex;
                if (index > 0 && bullwhipFactors[index-1]) {
                  const factor = bullwhipFactors[index-1];
                  let tooltip = '牛鞭效应系数:\n';
                  tooltip += `市场需求变化: ${factor.demandChange}\n`;
                  gameState.nodes.forEach((node, i) => {
                    const orderChange = factor.orderChanges[i];
                    const bullwhipFactor = factor.demandChange > 0 ? (orderChange / factor.demandChange).toFixed(2) : 'N/A';
                    tooltip += `${node.type}: ${bullwhipFactor}\n`;
                  });
                  return tooltip;
                }
              }
              return '';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          title: {
            display: true,
            text: '数量'
          }
        },
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 8, font: { size: 10 } },
          title: {
            display: true,
            text: '周期'
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });
}

// 生成建议
function generateSuggestions() {
  const suggestions = [];
  const avgCost = gameState.totalCost / gameState.totalCycles;
  
  if (avgCost > 30) {
    suggestions.push('成本较高，建议优化库存管理策略，平衡库存和缺货成本');
  }
  
  const avgInventory = gameState.inventoryHistory.flat().reduce((a, b) => a + b, 0) / 
    (gameState.inventoryHistory.length * gameState.totalCycles);
  
  if (avgInventory < 3) {
    suggestions.push('平均库存过低，建议提高安全库存水平以避免缺货');
  } else if (avgInventory > 15) {
    suggestions.push('平均库存过高，建议降低安全库存以减少持有成本');
  }
  
  if (gameState.informationMode === 'opaque') {
    suggestions.push('尝试使用信息透明模式，可以看到整个供应链信息，有助于减少牛鞭效应');
  } else {
    suggestions.push('当前为信息透明模式，充分利用供应链信息来优化决策');
  }
  
  if (gameState.aiStrategy === 'simple') {
    suggestions.push('尝试使用协同策略或平滑策略，这些策略能更好地应对需求波动');
  }
  
  const suggestionsDiv = document.getElementById('improvement-suggestions');
  suggestionsDiv.innerHTML = `<ul>${suggestions.map(s => `<li>${s}</li>`).join('')}</ul>`;
}

// 显示页面
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.getElementById(pageId).style.display = 'flex';
}

// 重新开始
function restartGame() {
  showPage('setup-section');
  
  // 清理图表
  Object.values(gameState.charts).forEach(chart => {
    if (chart) chart.destroy();
  });
  gameState.charts = {};
}

// 显示帮助
function showHelp() {
  document.getElementById('help-modal').style.display = 'flex';
}

// 隐藏帮助
function hideHelp() {
  document.getElementById('help-modal').style.display = 'none';
}

// 导出数据
function exportData() {
  // 构建CSV内容
  let csvContent = '周期,市场需求';
  
  // 添加节点标题
  gameState.nodes.forEach((node, index) => {
    csvContent += `,${node.type}库存,${node.type}缺货,${node.type}订单`;
  });
  csvContent += '\n';
  
  // 添加数据行
  for (let cycle = 0; cycle < gameState.totalCycles; cycle++) {
    let row = `${cycle + 1},${gameState.marketDemand[cycle] || '-'}`;
    
    gameState.nodes.forEach((node, nodeIndex) => {
      const inventory = gameState.inventoryHistory[nodeIndex][cycle] || 0;
      const backlog = gameState.backlogHistory[nodeIndex][cycle] || 0;
      const order = gameState.orderHistory[nodeIndex][cycle] || 0;
      row += `,${inventory},${backlog},${order}`;
    });
    
    csvContent += row + '\n';
  }
  
  // 创建下载链接
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `啤酒游戏数据_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// 生成海报
function generatePoster() {
  const posterContainer = document.getElementById('score-poster');
  if (!posterContainer) return;
  
  const avgCost = gameState.totalCost / gameState.totalCycles;
  let score, rating, comment;
  
  // 计算评分和点评
  if (avgCost < 10) {
    score = 95 + Math.floor(Math.random() * 6);
    rating = 'S级';
    comment = '供应链管理大师！你的决策几乎完美，牛鞭效应控制得恰到好处。';
  } else if (avgCost < 20) {
    score = 85 + Math.floor(Math.random() * 10);
    rating = 'A级';
    comment = '优秀的供应链管理者！你的决策平衡了库存和缺货成本，表现出色。';
  } else if (avgCost < 30) {
    score = 70 + Math.floor(Math.random() * 15);
    rating = 'B级';
    comment = '良好的表现！继续优化你的库存管理策略，减少牛鞭效应。';
  } else if (avgCost < 40) {
    score = 60 + Math.floor(Math.random() * 10);
    rating = 'C级';
    comment = '有改进空间。尝试使用信息透明模式，更好地应对需求波动。';
  } else {
    score = 50 + Math.floor(Math.random() * 10);
    rating = 'D级';
    comment = '需要大幅改进。建议学习供应链管理基本原理，平衡库存和缺货成本。';
  }
  
  // 构建海报内容
  posterContainer.innerHTML = `
    <div class="poster-header">
      <h2>🍺 啤酒游戏</h2>
      <h3>供应链管理挑战</h3>
    </div>
    <div class="poster-content">
      <div class="score-section">
        <div class="score">${score}</div>
        <div class="rating">${rating}</div>
      </div>
      <div class="info-section">
        <div class="info-item">
          <span class="label">扮演角色</span>
          <span class="value">${gameState.nodes[gameState.playerNodeIndex].type}</span>
        </div>
        <div class="info-item">
          <span class="label">总成本</span>
          <span class="value">${gameState.totalCost.toFixed(0)}</span>
        </div>
        <div class="info-item">
          <span class="label">平均成本</span>
          <span class="value">${(gameState.totalCost / gameState.totalCycles).toFixed(1)}</span>
        </div>
        <div class="info-item">
          <span class="label">游戏周期</span>
          <span class="value">${gameState.totalCycles}</span>
        </div>
      </div>
      <div class="comment-section">
        <h4>点评</h4>
        <p>${comment}</p>
      </div>
    </div>
    <div class="poster-footer">
      <p>📱 分享你的成绩</p>
      <p>💡 继续挑战更高难度</p>
    </div>
  `;
  
  // 显示海报模态框
  document.getElementById('poster-modal').style.display = 'flex';
}

// 下载海报
function downloadPoster() {
  const poster = document.getElementById('score-poster');
  if (!poster) return;
  
  // 简单的海报下载功能
  const html = poster.outerHTML;
  const blob = new Blob(['<!DOCTYPE html><html><head><meta charset="UTF-8"><title>啤酒游戏评分海报</title><style>body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; } .score-poster { width: 400px; height: 600px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; color: white; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); } .poster-header { text-align: center; margin-bottom: 30px; } .poster-header h2 { margin: 0; font-size: 28px; } .poster-header h3 { margin: 5px 0 0 0; font-size: 16px; opacity: 0.9; } .score-section { text-align: center; margin-bottom: 30px; } .score { font-size: 64px; font-weight: bold; margin: 0; } .rating { font-size: 24px; margin: 10px 0; } .info-section { background: rgba(255,255,255,0.1); border-radius: 10px; padding: 20px; margin-bottom: 20px; } .info-item { display: flex; justify-content: space-between; margin: 10px 0; } .info-item .label { font-size: 14px; opacity: 0.8; } .info-item .value { font-size: 16px; font-weight: bold; } .comment-section { background: rgba(255,255,255,0.1); border-radius: 10px; padding: 20px; margin-bottom: 30px; } .comment-section h4 { margin: 0 0 10px 0; font-size: 16px; } .comment-section p { margin: 0; line-height: 1.4; } .poster-footer { text-align: center; font-size: 14px; opacity: 0.8; } .poster-footer p { margin: 5px 0; }</style></head><body>' + html + '</body></html>'], { type: 'text/html' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `啤酒游戏评分海报_${new Date().toISOString().slice(0, 10)}.html`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 启动
init();
