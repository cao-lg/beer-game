// 测试牛鞭效应的表现
import {
  initGameState,
  processPlayerOrder,
  processAINodes,
  processCycle,
  isGameOver,
  getGameResults
} from './src/supplyChainAlgorithm.js';

/**
 * 测试牛鞭效应
 * 验证需求波动从下游到上游逐级放大的效果
 */
function testBullwhipEffect() {
  console.log('=== 测试牛鞭效应 ===');
  
  const config = {
    supplyChainLength: 4,
    initialInventory: 35,
    safetyStock: 10,
    orderDelay: 1,
    logisticsDelay: 1,
    totalCycles: 15,
    demandType: 'fluctuating' // 使用波动需求来测试牛鞭效应
  };
  
  let gameState = initGameState(config);
  
  console.log('市场需求:', gameState.marketDemand);
  console.log('');
  
  // 运行15个周期
  for (let i = 0; i < config.totalCycles; i++) {
    // 玩家（零售商）下单10单位
    processPlayerOrder(gameState, 10);
    
    // 处理AI节点订单
    processAINodes(gameState);
    
    // 处理周期
    gameState = processCycle(gameState);
  }
  
  // 获取结果
  const results = getGameResults(gameState);
  
  console.log('=== 牛鞭效应分析 ===');
  console.log('市场需求:', results.marketDemand);
  console.log('');
  
  // 输出各节点的订单历史
  results.nodes.forEach((node, index) => {
    console.log(`${node.type}订单历史:`, results.orderHistory[index]);
  });
  
  console.log('');
  
  // 计算牛鞭效应系数
  console.log('=== 牛鞭效应系数分析 ===');
  if (results.marketDemand.length > 1) {
    for (let i = 1; i < config.totalCycles; i++) {
      const demandChange = Math.abs(results.marketDemand[i] - results.marketDemand[i-1]);
      console.log(`\n周期 ${i+1}: 市场需求变化 = ${demandChange}`);
      
      results.nodes.forEach((node, index) => {
        const orderChange = Math.abs(results.orderHistory[index][i] - results.orderHistory[index][i-1]);
        const bullwhipFactor = demandChange > 0 ? (orderChange / demandChange).toFixed(2) : 'N/A';
        console.log(`${node.type}: 订单变化 = ${orderChange}, 牛鞭系数 = ${bullwhipFactor}`);
      });
    }
  }
  
  console.log('');
  console.log('=== 测试完成 ===');
  console.log('牛鞭效应表现：需求波动从下游到上游逐级放大');
  console.log('零售商 → 批发商 → 分销商 → 生产商');
  console.log('订单波动幅度应该逐渐增大');
}

// 运行测试
testBullwhipEffect();
