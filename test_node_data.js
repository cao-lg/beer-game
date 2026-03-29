// 测试每个节点的数据计算逻辑
// 重点分析批发商的数据处理

import {
  initGameState,
  processPlayerOrder,
  processAINodes,
  processCycle,
  getGameResults
} from './src/supplyChainAlgorithm.js';

/**
 * 测试每个节点的数据计算
 * 重点分析批发商的数据处理逻辑
 */
function testNodeData() {
  console.log('=== 测试每个节点的数据计算 ===');
  
  const config = {
    supplyChainLength: 4,
    initialInventory: 35,
    safetyStock: 10,
    orderDelay: 1,
    logisticsDelay: 1,
    totalCycles: 10,
    demandType: 'stable'
  };
  
  let gameState = initGameState(config);
  
  console.log('初始状态:');
  gameState.nodes.forEach((node, index) => {
    console.log(`${node.type}: 库存=${node.inventory}, 缺货=${node.backlog}`);
  });
  console.log('市场需求:', gameState.marketDemand);
  console.log('');
  
  // 运行10个周期
  for (let i = 0; i < config.totalCycles; i++) {
    console.log(`=== 周期 ${i + 1} ===`);
    
    // 玩家（零售商）下单10单位
    processPlayerOrder(gameState, 10);
    console.log('零售商下单: 10');
    
    // 处理AI节点订单
    processAINodes(gameState);
    
    // 处理周期
    gameState = processCycle(gameState);
    
    // 输出每个节点的状态
    gameState.nodes.forEach((node, index) => {
      console.log(`${node.type}: 库存=${node.inventory.toFixed(1)}, 缺货=${node.backlog}, 成本=${node.cost.toFixed(1)}`);
    });
    
    // 输出订单历史
    console.log('订单历史:');
    gameState.nodes.forEach((node, index) => {
      const orders = gameState.orderHistory[index];
      console.log(`${node.type}: ${orders[orders.length - 1] || 0}`);
    });
    
    console.log('');
  }
  
  // 获取结果
  const results = getGameResults(gameState);
  
  console.log('=== 最终结果 ===');
  console.log('总成本:', results.totalCost.toFixed(1));
  console.log('各节点最终状态:');
  results.nodes.forEach(node => {
    console.log(`${node.type}: 库存=${node.finalInventory.toFixed(1)}, 缺货=${node.finalBacklog}, 成本=${node.cost.toFixed(1)}`);
  });
  
  console.log('');
  console.log('=== 订单历史分析 ===');
  results.nodes.forEach((node, index) => {
    console.log(`${node.type}:`, results.orderHistory[index]);
  });
  
  console.log('');
  console.log('=== 库存历史分析 ===');
  results.nodes.forEach((node, index) => {
    console.log(`${node.type}:`, gameState.inventoryHistory[index].map(inv => inv.toFixed(1)));
  });
}

// 运行测试
testNodeData();
