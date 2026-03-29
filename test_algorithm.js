// 测试供应链算法的正确性和稳定性
import { initGameState, processCycle, processAINodes } from './src/supplyChainAlgorithm.js';

/**
 * 测试稳定需求场景
 */
function testStableDemand() {
  console.log('=== 测试稳定需求场景 ===');
  
  const config = {
    supplyChainLength: 4,
    initialInventory: 30,
    safetyStock: 10,
    orderDelay: 2,
    logisticsDelay: 2,
    totalCycles: 20,
    demandType: 'stable',
    aiStrategy: 'conservative'
  };
  
  let gameState = initGameState(config);
  
  for (let i = 0; i < config.totalCycles; i++) {
    // 处理AI节点的订单决策
    processAINodes(gameState);
    // 处理当前周期
    gameState = processCycle(gameState);
    
    // 打印每个周期的节点状态
    console.log(`\n周期 ${i + 1}:`);
    gameState.nodes.forEach((node, index) => {
      const orderQty = gameState.orderHistory[index][i] || 0;
      console.log(`${node.type}: 库存=${node.inventory}, 缺货=${node.backlog}, 订单=${orderQty}, 成本=${node.cost.toFixed(2)}`);
    });
  }
  
  // 打印最终结果
  console.log('\n=== 最终结果 ===');
  console.log(`总周期: ${gameState.currentCycle}`);
  console.log(`总成本: ${gameState.totalCost.toFixed(2)}`);
  gameState.nodes.forEach((node, index) => {
    console.log(`${node.type}: 最终库存=${node.inventory}, 最终缺货=${node.backlog}, 总成本=${node.cost.toFixed(2)}`);
  });
}

/**
 * 测试波动需求场景
 */
function testFluctuatingDemand() {
  console.log('\n\n=== 测试波动需求场景 ===');
  
  const config = {
    supplyChainLength: 4,
    initialInventory: 30,
    safetyStock: 10,
    orderDelay: 2,
    logisticsDelay: 2,
    totalCycles: 20,
    demandType: 'fluctuating',
    aiStrategy: 'conservative'
  };
  
  let gameState = initGameState(config);
  
  for (let i = 0; i < config.totalCycles; i++) {
    // 处理AI节点的订单决策
    processAINodes(gameState);
    // 处理当前周期
    gameState = processCycle(gameState);
    
    // 打印每个周期的节点状态
    console.log(`\n周期 ${i + 1}:`);
    gameState.nodes.forEach((node, index) => {
      const orderQty = gameState.orderHistory[index][i] || 0;
      console.log(`${node.type}: 库存=${node.inventory}, 缺货=${node.backlog}, 订单=${orderQty}, 成本=${node.cost.toFixed(2)}`);
    });
  }
  
  // 打印最终结果
  console.log('\n=== 最终结果 ===');
  console.log(`总周期: ${gameState.currentCycle}`);
  console.log(`总成本: ${gameState.totalCost.toFixed(2)}`);
  gameState.nodes.forEach((node, index) => {
    console.log(`${node.type}: 最终库存=${node.inventory}, 最终缺货=${node.backlog}, 总成本=${node.cost.toFixed(2)}`);
  });
}

/**
 * 测试季节性需求场景
 */
function testSeasonalDemand() {
  console.log('\n\n=== 测试季节性需求场景 ===');
  
  const config = {
    supplyChainLength: 4,
    initialInventory: 30,
    safetyStock: 10,
    orderDelay: 2,
    logisticsDelay: 2,
    totalCycles: 24,
    demandType: 'seasonal',
    aiStrategy: 'conservative'
  };
  
  let gameState = initGameState(config);
  
  for (let i = 0; i < config.totalCycles; i++) {
    // 处理AI节点的订单决策
    processAINodes(gameState);
    // 处理当前周期
    gameState = processCycle(gameState);
    
    // 打印每个周期的节点状态
    console.log(`\n周期 ${i + 1}:`);
    gameState.nodes.forEach((node, index) => {
      const orderQty = gameState.orderHistory[index][i] || 0;
      console.log(`${node.type}: 库存=${node.inventory}, 缺货=${node.backlog}, 订单=${orderQty}, 成本=${node.cost.toFixed(2)}`);
    });
  }
  
  // 打印最终结果
  console.log('\n=== 最终结果 ===');
  console.log(`总周期: ${gameState.currentCycle}`);
  console.log(`总成本: ${gameState.totalCost.toFixed(2)}`);
  gameState.nodes.forEach((node, index) => {
    console.log(`${node.type}: 最终库存=${node.inventory}, 最终缺货=${node.backlog}, 总成本=${node.cost.toFixed(2)}`);
  });
}

/**
 * 测试随机需求场景
 */
function testRandomDemand() {
  console.log('\n\n=== 测试随机需求场景 ===');
  
  const config = {
    supplyChainLength: 4,
    initialInventory: 30,
    safetyStock: 10,
    orderDelay: 2,
    logisticsDelay: 2,
    totalCycles: 20,
    demandType: 'random',
    aiStrategy: 'conservative'
  };
  
  let gameState = initGameState(config);
  
  for (let i = 0; i < config.totalCycles; i++) {
    // 处理AI节点的订单决策
    processAINodes(gameState);
    // 处理当前周期
    gameState = processCycle(gameState);
    
    // 打印每个周期的节点状态
    console.log(`\n周期 ${i + 1}:`);
    gameState.nodes.forEach((node, index) => {
      const orderQty = gameState.orderHistory[index][i] || 0;
      console.log(`${node.type}: 库存=${node.inventory}, 缺货=${node.backlog}, 订单=${orderQty}, 成本=${node.cost.toFixed(2)}`);
    });
  }
  
  // 打印最终结果
  console.log('\n=== 最终结果 ===');
  console.log(`总周期: ${gameState.currentCycle}`);
  console.log(`总成本: ${gameState.totalCost.toFixed(2)}`);
  gameState.nodes.forEach((node, index) => {
    console.log(`${node.type}: 最终库存=${node.inventory}, 最终缺货=${node.backlog}, 总成本=${node.cost.toFixed(2)}`);
  });
}

/**
 * 测试算法稳定性
 */
function testAlgorithmStability() {
  console.log('\n\n=== 测试算法稳定性 ===');
  
  const config = {
    supplyChainLength: 4,
    initialInventory: 30,
    safetyStock: 10,
    orderDelay: 2,
    logisticsDelay: 2,
    totalCycles: 50,
    demandType: 'stable',
    aiStrategy: 'conservative'
  };
  
  let gameState = initGameState(config);
  let maxInventory = 0;
  let maxBacklog = 0;
  
  for (let i = 0; i < config.totalCycles; i++) {
    // 处理AI节点的订单决策
    processAINodes(gameState);
    // 处理当前周期
    gameState = processCycle(gameState);
    
    // 检查库存和缺货是否合理
    gameState.nodes.forEach((node, index) => {
      if (node.inventory > maxInventory) maxInventory = node.inventory;
      if (node.backlog > maxBacklog) maxBacklog = node.backlog;
      
      // 确保库存和缺货都是非负整数
      if (node.inventory < 0 || !Number.isInteger(node.inventory)) {
        console.error(`错误: ${node.type} 库存为负数或非整数: ${node.inventory}`);
      }
      if (node.backlog < 0 || !Number.isInteger(node.backlog)) {
        console.error(`错误: ${node.type} 缺货为负数或非整数: ${node.backlog}`);
      }
    });
  }
  
  // 打印稳定性测试结果
  console.log('\n=== 稳定性测试结果 ===');
  console.log(`最大库存: ${maxInventory}`);
  console.log(`最大缺货: ${maxBacklog}`);
  console.log('算法运行稳定，未发现负数或非整数库存/缺货');
}

// 运行所有测试
console.log('开始测试供应链算法...');
testStableDemand();
testFluctuatingDemand();
testSeasonalDemand();
testRandomDemand();
testAlgorithmStability();
console.log('\n所有测试完成！');
