// 供应链算法模块
// 处理供应链节点的订单、物流和库存管理

/**
 * 初始化游戏状态
 * @param {Object} config 游戏配置
 * @returns {Object} 初始化的游戏状态
 */
export function initGameState(config) {
  const {
    supplyChainLength,
    initialInventory,
    safetyStock,
    orderDelay,
    logisticsDelay,
    totalCycles,
    demandType
  } = config;

  const nodeTypes = ['生产商', '分销商', '批发商', '零售商'];
  const nodes = [];

  // 初始化节点
  for (let i = 0; i < supplyChainLength; i++) {
    nodes.push({
      type: nodeTypes[Math.min(i, nodeTypes.length - 1)],
      inventory: initialInventory,
      safetyStock: safetyStock,
      orderDelay: orderDelay,
      logisticsDelay: logisticsDelay,
      incomingOrders: [],
      outgoingOrders: [],
      inTransit: [],
      backlog: 0,
      cost: 0,
      demandHistory: []
    });
  }

  // 生成市场需求
  const marketDemand = generateMarketDemand(totalCycles, demandType);

  return {
    supplyChainLength,
    nodes,
    currentCycle: 0,
    totalCycles,
    inventoryCost: 0.5,
    shortageCost: 1.0,
    informationMode: 'opaque',
    aiStrategy: 'simple',
    demandType,
    playerNodeIndex: supplyChainLength - 1, // 默认玩家为零售商
    marketDemand,
    totalCost: 0,
    orderHistory: Array(supplyChainLength).fill().map(() => []),
    inventoryHistory: Array(supplyChainLength).fill().map(() => []),
    backlogHistory: Array(supplyChainLength).fill().map(() => []),
    charts: {}
  };
}

/**
 * 生成市场需求
 * @param {number} cycles 周期数
 * @param {string} demandType 需求类型
 * @returns {Array} 市场需求数组
 */
function generateMarketDemand(cycles, demandType) {
  const demand = [];
  const baseDemand = 10;
  
  for (let i = 0; i < cycles; i++) {
    let currentDemand;
    
    switch (demandType) {
      case 'stable':
        currentDemand = baseDemand + Math.floor(Math.random() * 3) - 1;
        currentDemand = Math.max(8, Math.min(12, currentDemand));
        break;
      case 'fluctuating':
        currentDemand = baseDemand + Math.floor(Math.sin(i / 3) * 5);
        currentDemand = Math.max(5, currentDemand);
        break;
      case 'seasonal':
        if (i % 12 < 3) {
          currentDemand = baseDemand * 1.5 + Math.floor(Math.random() * 3);
        } else if (i % 12 < 9) {
          currentDemand = baseDemand + Math.floor(Math.random() * 3) - 1;
        } else {
          currentDemand = baseDemand * 0.7 + Math.floor(Math.random() * 2);
        }
        break;
      case 'random':
      default:
        currentDemand = baseDemand + Math.floor(Math.random() * 7) - 3;
        currentDemand = Math.max(3, currentDemand);
        break;
    }
    
    currentDemand = Math.round(currentDemand);
    demand.push(currentDemand);
  }
  
  return demand;
}

/**
 * 处理AI节点的订单决策
 * @param {Object} gameState 游戏状态
 */
export function processAINodes(gameState) {
  // 从下游到上游处理，确保订单正确传递
  for (let index = gameState.nodes.length - 1; index >= 0; index--) {
    const node = gameState.nodes[index];
    // 只有非玩家节点需要AI决策
    if (index === gameState.playerNodeIndex) continue;
    
    let orderQty = 0;
    
    // 计算当前库存水平
    const currentInventory = node.inventory;
    // 计算在途货物总量
    const inTransitTotal = node.inTransit.reduce((sum, item) => sum + item.quantity, 0);
    // 计算可用库存（当前库存 + 在途货物 - 缺货）
    const availableInventory = currentInventory + inTransitTotal - node.backlog;
    
    // 计算需求预测 - 考虑未来多个周期的需求
    let forecastDemand = 10; // 默认预测需求
    if (node.demandHistory.length > 0) {
      // 使用最近5个周期的加权平均需求作为预测，更重视最近的需求
      const recentDemand = node.demandHistory.slice(-5);
      let weightedSum = 0;
      let totalWeight = 0;
      for (let i = 0; i < recentDemand.length; i++) {
        const weight = i + 1; // 越近的需求权重越高
        weightedSum += recentDemand[i] * weight;
        totalWeight += weight;
      }
      forecastDemand = weightedSum / totalWeight;
      
      // 增加预测误差，上游节点误差更大，增强牛鞭效应
      const errorFactor = 0.4 + (gameState.supplyChainLength - index - 1) * 0.2; // 增加误差，使上游预测更不准确
      forecastDemand *= (1 + (Math.random() - 0.5) * errorFactor);
      forecastDemand = Math.max(5, forecastDemand);
    }
    
    // 计算安全库存水平
    const safetyStock = node.safetyStock;
    
    // 考虑订单延迟和物流延迟，提前预测需求
    const leadTime = node.orderDelay + node.logisticsDelay;
    const totalForecast = forecastDemand * (leadTime + 1); // 预测未来leadTime+1个周期的需求
    
    // 上游节点设置更高的安全库存，增强牛鞭效应
    const adjustedSafetyStock = safetyStock * (1 + (gameState.supplyChainLength - index - 1) * 0.3); // 增加上游节点安全库存增加幅度
    
    // 短缺博弈效应：当节点有缺货时，会夸大订单量
    let shortageMultiplier = 1;
    if (node.backlog > 0) {
      shortageMultiplier = 1 + (node.backlog / (currentInventory + 1)) * 0.5; // 缺货越多，订单量增加越多
    }
    
    switch (gameState.aiStrategy) {
      case 'simple':
        // 基于安全库存和当前库存的简单策略
        // 考虑当前库存、在途货物和预测需求
        orderQty = Math.max(0, (adjustedSafetyStock + totalForecast - availableInventory) * shortageMultiplier);
        break;
      case 'smoothing':
        // 平滑策略 - 基于需求预测和库存水平，避免订单波动
        const smoothingFactor = 0.3; // 增加平滑系数，减少波动
        const baseOrder = (adjustedSafetyStock + totalForecast - availableInventory) * shortageMultiplier;
        // 检查上一次订单
        const lastOrder = gameState.orderHistory[index].length > 0 
          ? gameState.orderHistory[index][gameState.orderHistory[index].length - 1] 
          : 0;
        // 平滑订单量，避免大幅波动
        orderQty = Math.max(0, Math.round(lastOrder * (1 - smoothingFactor) + baseOrder * smoothingFactor));
        break;
      case 'collaborative':
        if (gameState.informationMode === 'transparent') {
          // 信息透明模式 - 直接使用市场需求
          const marketDemand = gameState.marketDemand[gameState.currentCycle] || 10;
          orderQty = Math.max(0, (adjustedSafetyStock + marketDemand * (leadTime + 1) - availableInventory) * shortageMultiplier);
        } else {
          // 信息不透明模式 - 使用需求历史
          orderQty = Math.max(0, (adjustedSafetyStock + totalForecast - availableInventory) * shortageMultiplier);
        }
        break;
      case 'aggressive':
        // 激进策略 - 维持较高的库存水平
        orderQty = Math.max(0, (adjustedSafetyStock * 1.2 + totalForecast - availableInventory) * shortageMultiplier);
        break;
      case 'conservative':
        // 保守策略 - 只维持基本安全库存
        orderQty = Math.max(0, (adjustedSafetyStock + forecastDemand - currentInventory) * shortageMultiplier);
        break;
      default:
        orderQty = Math.max(0, (adjustedSafetyStock + totalForecast - availableInventory) * shortageMultiplier);
        break;
    }
    
    // 增加订单批量效应，上游节点批量更大，增强牛鞭效应
    const batchSize = 5 + (gameState.supplyChainLength - index - 1) * 3; // 增加上游节点批量增加幅度
    orderQty = Math.ceil(orderQty / batchSize) * batchSize;
    
    // 限制订单量，避免过度订购
    orderQty = Math.max(0, Math.min(orderQty, 40)); // 减少最大订单量限制
    
    if (index > 0) {
      const supplier = gameState.nodes[index - 1];
      const order = {
        quantity: orderQty,
        cycle: gameState.currentCycle + 1,
        fromNode: index
      };
      supplier.incomingOrders.push(order);
      gameState.nodes[index].outgoingOrders.push(order);
      gameState.orderHistory[index].push(orderQty);
    } else if (index === 0) {
      // 生产商也要生成订单，订单数量反映准备生产的数量
      // 这样可以更好地体现牛鞭效应
      const order = {
        quantity: orderQty,
        cycle: gameState.currentCycle + 1,
        fromNode: index
      };
      gameState.nodes[index].outgoingOrders.push(order);
      gameState.orderHistory[index].push(orderQty);
    }
  }
}

/**
 * 处理玩家订单
 * @param {Object} gameState 游戏状态
 * @param {number} quantity 订单数量
 */
export function processPlayerOrder(gameState, quantity) {
  if (gameState.playerNodeIndex > 0) {
    const supplier = gameState.nodes[gameState.playerNodeIndex - 1];
    const order = {
      quantity: quantity,
      cycle: gameState.currentCycle + 1,
      fromNode: gameState.playerNodeIndex
    };
    supplier.incomingOrders.push(order);
    gameState.nodes[gameState.playerNodeIndex].outgoingOrders.push(order);
    gameState.orderHistory[gameState.playerNodeIndex].push(quantity);
  }
}

/**
 * 处理一个游戏周期
 * @param {Object} gameState 游戏状态
 * @returns {Object} 更新后的游戏状态
 */
export function processCycle(gameState) {
  // 如果已经达到总周期数，直接返回
  if (gameState.currentCycle >= gameState.totalCycles) {
    return gameState;
  }
  
  // 1. 处理所有节点的在途货物（物流配送）- 按零售商→批发商→分销商→生产商的顺序
  // 确保下游节点先接收货物，以便正确处理需求
  for (let index = gameState.nodes.length - 1; index >= 0; index--) {
    const node = gameState.nodes[index];
    
    // 检查是否有到达的在途货物
    const arrivedGoods = node.inTransit.filter(item => 
      gameState.currentCycle - item.cycle >= item.logisticsDelay
    );
    
    // 接收货物，确保数量为整数
    const totalArrived = Math.floor(arrivedGoods.reduce((sum, item) => sum + item.quantity, 0));
    node.inventory = Math.max(0, node.inventory + totalArrived);
    
    // 清理已到达的货物
    node.inTransit = node.inTransit.filter(item => 
      gameState.currentCycle - item.cycle < item.logisticsDelay
    );
  }
  
  // 2. 零售商处理市场需求
  const retailer = gameState.nodes[gameState.nodes.length - 1];
  const demand = gameState.marketDemand[gameState.currentCycle];
  
  // 记录市场需求
  retailer.demandHistory.push(demand);
  
  // 满足市场需求，优先使用库存
  if (retailer.inventory >= demand) {
    retailer.inventory = Math.max(0, retailer.inventory - demand);
  } else {
    const shortage = demand - retailer.inventory;
    retailer.backlog = Math.max(0, retailer.backlog + shortage);
    retailer.inventory = 0;
  }
  
  // 3. 处理所有节点的订单（订单处理和发货）- 按生产商→分销商→批发商→零售商的顺序
  // 确保上游节点先处理订单，以便下游节点能及时收到货物
  for (let index = 0; index < gameState.nodes.length; index++) {
    const node = gameState.nodes[index];
    
    // 处理入单 - 订单延迟从下单周期开始计算
    const validOrders = node.incomingOrders.filter(o => 
      gameState.currentCycle >= o.cycle + node.orderDelay
    );
    
    // 处理每个订单
    validOrders.forEach(order => {
      // 记录需求历史（所有节点都需要记录需求）
      node.demandHistory.push(order.quantity);
      
      // 计算可发货量，确保数量为整数
      // 优先满足订单，使用当前库存加上在途货物
      const totalAvailable = node.inventory + node.inTransit.reduce((sum, item) => sum + item.quantity, 0);
      const canShip = Math.floor(Math.min(order.quantity, totalAvailable));
      
      // 减少库存
      if (node.inventory >= canShip) {
        node.inventory = Math.max(0, node.inventory - canShip);
      } else {
        // 如果库存不足，使用所有库存
        const shippedFromInventory = node.inventory;
        node.inventory = 0;
        // 剩余部分从在途货物中扣除（实际中这部分会在货物到达后处理）
        // 这里我们只记录缺货，等待在途货物到达
        node.backlog = Math.max(0, node.backlog + (canShip - shippedFromInventory));
      }
      
      // 如果有缺货，记录缺货数量
      if (canShip < order.quantity) {
        node.backlog = Math.max(0, node.backlog + (order.quantity - canShip));
      }
      
      // 如果有下游节点，将货物发送过去（考虑物流延迟）
      if (order.fromNode !== undefined) {
        const downstreamNode = gameState.nodes[order.fromNode];
        downstreamNode.inTransit.push({
          quantity: canShip,
          cycle: gameState.currentCycle,
          logisticsDelay: downstreamNode.logisticsDelay
        });
      }
    });
    
    // 清理已处理订单
    node.incomingOrders = node.incomingOrders.filter(o => 
      gameState.currentCycle < o.cycle + node.orderDelay
    );
  }
  
  // 4. 生产商生产
  const producer = gameState.nodes[0];
  
  // 计算总需求（包括已接收的订单和预测需求）
  const pendingOrders = producer.incomingOrders.reduce((sum, order) => sum + order.quantity, 0);
  
  // 计算最近的需求历史，使用加权平均以更重视最近的需求
  const recentDemand = producer.demandHistory.slice(-5); // 考虑最近5个周期的需求
  let weightedDemand = 10; // 默认需求
  if (recentDemand.length > 0) {
    // 计算加权平均，最近的需求权重更高
    let totalWeight = 0;
    let weightedSum = 0;
    for (let i = 0; i < recentDemand.length; i++) {
      const weight = i + 1; // 越近的需求权重越高
      weightedSum += recentDemand[i] * weight;
      totalWeight += weight;
    }
    weightedDemand = weightedSum / totalWeight;
  }
  
  // 考虑生产周期延迟，提前预测需求
  const productionLeadTime = 1; // 生产周期为1个周期
  const forecastDemand = weightedDemand * (productionLeadTime + 1);
  
  // 计算目标库存水平，考虑安全库存和预期需求
  const targetInventory = producer.safetyStock + forecastDemand;
  
  // 计算需要生产的数量，考虑当前库存、缺货和待处理订单
  const productionNeeded = Math.max(0, pendingOrders + targetInventory - producer.inventory - producer.backlog);
  
  // 生产能力限制为20单位/周期，确保生产数量为整数
  const maxProduction = 20;
  const actualProduction = Math.floor(Math.min(productionNeeded, maxProduction));
  
  // 确保生产数量至少满足基本需求，避免过度减少生产
  const minProduction = Math.floor(weightedDemand * 0.8); // 至少生产80%的预测需求
  const finalProduction = Math.max(actualProduction, minProduction);
  
  producer.inventory = Math.max(0, producer.inventory + finalProduction);
  
  // 5. 处理缺货 - 优先满足缺货
  for (let index = gameState.nodes.length - 1; index >= 0; index--) {
    const node = gameState.nodes[index];
    if (node.backlog > 0 && node.inventory > 0) {
      const canFulfill = Math.floor(Math.min(node.backlog, node.inventory));
      node.backlog = Math.max(0, node.backlog - canFulfill);
      node.inventory = Math.max(0, node.inventory - canFulfill);
    }
  }
  
  // 6. 计算成本和记录历史数据
  gameState.nodes.forEach((node, index) => {
    // 计算成本
    const cycleCost = node.inventory * gameState.inventoryCost + node.backlog * gameState.shortageCost;
    node.cost += cycleCost;
    gameState.totalCost += cycleCost;
    
    // 记录库存历史
    gameState.inventoryHistory[index].push(node.inventory);
    // 记录缺货历史
    gameState.backlogHistory[index].push(node.backlog);
  });
  
  gameState.currentCycle++;
  return gameState;
}

/**
 * 检查游戏是否结束
 * @param {Object} gameState 游戏状态
 * @returns {boolean} 是否结束
 */
export function isGameOver(gameState) {
  return gameState.currentCycle >= gameState.totalCycles;
}

/**
 * 获取游戏结果
 * @param {Object} gameState 游戏状态
 * @returns {Object} 游戏结果
 */
export function getGameResults(gameState) {
  const results = {
    totalCost: gameState.totalCost,
    avgCost: gameState.totalCost / gameState.totalCycles,
    nodes: gameState.nodes.map((node, index) => ({
      type: node.type,
      cost: node.cost,
      finalInventory: node.inventory,
      finalBacklog: node.backlog
    })),
    orderHistory: gameState.orderHistory,
    inventoryHistory: gameState.inventoryHistory,
    backlogHistory: gameState.backlogHistory,
    marketDemand: gameState.marketDemand
  };
  
  return results;
}
