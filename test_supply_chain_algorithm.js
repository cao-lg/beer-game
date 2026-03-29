// 测试供应链算法
// 验证算法的核心功能和逻辑正确性

import {
  initGameState,
  processPlayerOrder,
  processAINodes,
  processCycle,
  isGameOver,
  getGameResults
} from './src/supplyChainAlgorithm.js';

/**
 * 测试1: 基本供应链运作
 * 验证零售商在稳定需求下是否会缺货
 */
function testBasicSupplyChain() {
  console.log('=== 测试1: 基本供应链运作 ===');
  
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
  
  console.log('初始化完成，市场需求:', gameState.marketDemand);
  
  // 运行10个周期
  for (let i = 0; i < config.totalCycles; i++) {
    console.log(`\n--- 周期 ${i + 1} ---`);
    
    // 玩家（零售商）下单10单位
    processPlayerOrder(gameState, 10);
    console.log('零售商下单: 10');
    
    // 处理AI节点订单
    processAINodes(gameState);
    
    // 处理周期
    gameState = processCycle(gameState);
    
    // 检查零售商库存和缺货
    const retailer = gameState.nodes[gameState.playerNodeIndex];
    console.log(`零售商状态: 库存=${retailer.inventory}, 缺货=${retailer.backlog}`);
    
    // 检查第三周期是否缺货
    if (i === 2) {
      if (retailer.backlog > 0) {
        console.log('❌ 测试失败: 零售商在第三周期缺货');
      } else {
        console.log('✅ 测试通过: 零售商在第三周期没有缺货');
      }
    }
  }
  
  // 获取结果
  const results = getGameResults(gameState);
  console.log('\n测试1结果:');
  console.log('总成本:', results.totalCost.toFixed(1));
  console.log('平均成本:', results.avgCost.toFixed(1));
  console.log('各节点最终状态:');
  results.nodes.forEach(node => {
    console.log(`${node.type}: 库存=${node.finalInventory}, 缺货=${node.finalBacklog}, 成本=${node.cost.toFixed(1)}`);
  });
  
  console.log('=== 测试1完成 ===\n');
}

/**
 * 测试2: 不同AI策略
 * 验证不同AI策略的表现
 */
function testAIStrategies() {
  console.log('=== 测试2: 不同AI策略 ===');
  
  const strategies = ['simple', 'smoothing', 'aggressive', 'conservative'];
  const config = {
    supplyChainLength: 4,
    initialInventory: 35,
    safetyStock: 10,
    orderDelay: 1,
    logisticsDelay: 1,
    totalCycles: 5,
    demandType: 'stable'
  };
  
  strategies.forEach(strategy => {
    console.log(`\n--- 策略: ${strategy} ---`);
    
    let gameState = initGameState(config);
    gameState.aiStrategy = strategy;
    
    for (let i = 0; i < config.totalCycles; i++) {
      processPlayerOrder(gameState, 10);
      processAINodes(gameState);
      gameState = processCycle(gameState);
    }
    
    const results = getGameResults(gameState);
    console.log(`总成本: ${results.totalCost.toFixed(1)}, 平均成本: ${results.avgCost.toFixed(1)}`);
  });
  
  console.log('=== 测试2完成 ===\n');
}

/**
 * 测试3: 不同需求类型
 * 验证算法在不同需求模式下的表现
 */
function testDemandTypes() {
  console.log('=== 测试3: 不同需求类型 ===');
  
  const demandTypes = ['stable', 'fluctuating', 'seasonal', 'random'];
  const config = {
    supplyChainLength: 4,
    initialInventory: 35,
    safetyStock: 10,
    orderDelay: 1,
    logisticsDelay: 1,
    totalCycles: 5,
    demandType: 'stable'
  };
  
  demandTypes.forEach(demandType => {
    console.log(`\n--- 需求类型: ${demandType} ---`);
    
    const testConfig = { ...config, demandType };
    let gameState = initGameState(testConfig);
    
    console.log('市场需求:', gameState.marketDemand);
    
    for (let i = 0; i < config.totalCycles; i++) {
      processPlayerOrder(gameState, 10);
      processAINodes(gameState);
      gameState = processCycle(gameState);
    }
    
    const results = getGameResults(gameState);
    console.log(`总成本: ${results.totalCost.toFixed(1)}, 平均成本: ${results.avgCost.toFixed(1)}`);
  });
  
  console.log('=== 测试3完成 ===\n');
}

/**
 * 测试4: 信息透明模式
 * 验证信息透明模式对供应链的影响
 */
function testInformationModes() {
  console.log('=== 测试4: 信息透明模式 ===');
  
  const modes = ['opaque', 'transparent'];
  const config = {
    supplyChainLength: 4,
    initialInventory: 35,
    safetyStock: 10,
    orderDelay: 1,
    logisticsDelay: 1,
    totalCycles: 5,
    demandType: 'stable'
  };
  
  modes.forEach(mode => {
    console.log(`\n--- 信息模式: ${mode} ---`);
    
    let gameState = initGameState(config);
    gameState.informationMode = mode;
    gameState.aiStrategy = 'collaborative';
    
    for (let i = 0; i < config.totalCycles; i++) {
      processPlayerOrder(gameState, 10);
      processAINodes(gameState);
      gameState = processCycle(gameState);
    }
    
    const results = getGameResults(gameState);
    console.log(`总成本: ${results.totalCost.toFixed(1)}, 平均成本: ${results.avgCost.toFixed(1)}`);
  });
  
  console.log('=== 测试4完成 ===\n');
}

/**
 * 测试5: 供应链长度变化
 * 验证不同供应链长度的表现
 */
function testSupplyChainLengths() {
  console.log('=== 测试5: 供应链长度变化 ===');
  
  const lengths = [3, 4, 5];
  const config = {
    initialInventory: 35,
    safetyStock: 10,
    orderDelay: 1,
    logisticsDelay: 1,
    totalCycles: 5,
    demandType: 'stable'
  };
  
  lengths.forEach(length => {
    console.log(`\n--- 供应链长度: ${length} ---`);
    
    const testConfig = { ...config, supplyChainLength: length };
    let gameState = initGameState(testConfig);
    
    for (let i = 0; i < config.totalCycles; i++) {
      processPlayerOrder(gameState, 10);
      processAINodes(gameState);
      gameState = processCycle(gameState);
    }
    
    const results = getGameResults(gameState);
    console.log(`总成本: ${results.totalCost.toFixed(1)}, 平均成本: ${results.avgCost.toFixed(1)}`);
  });
  
  console.log('=== 测试5完成 ===\n');
}

/**
 * 运行所有测试
 */
function runAllTests() {
  console.log('开始测试供应链算法...\n');
  
  testBasicSupplyChain();
  testAIStrategies();
  testDemandTypes();
  testInformationModes();
  testSupplyChainLengths();
  
  console.log('所有测试完成！');
}

// 运行测试
runAllTests();
