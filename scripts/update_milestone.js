#!/usr/bin/env node

/**
 * 里程碑更新助手脚本
 * 
 * 这个脚本帮助开发人员快速更新项目里程碑文档
 * 使用方法: 
 *   node scripts/update_milestone.js "新成果描述" "阶段编号"
 * 
 * 示例:
 *   node scripts/update_milestone.js "完成交易构建模块" 3
 */

const fs = require('node:fs');
const path = require('node:path');

// 里程碑文件路径
const MILESTONE_FILE = path.join(__dirname, '..', 'milestones.md');

/**
 * 更新里程碑文件
 * @param {string} newAchievement - 新的成果描述
 * @param {number} phase - 阶段编号 (1-4)
 */
function updateMilestone(newAchievement, phase) {
  // 读取现有文件
  let content;
  try {
    content = fs.readFileSync(MILESTONE_FILE, 'utf8');
  } catch (err) {
    console.error('无法读取里程碑文件:', err.message);
    process.exit(1);
  }

  // 验证阶段编号
  if (phase < 1 || phase > 4) {
    console.error('阶段编号必须在1-4之间');
    process.exit(1);
  }

  // 查找对应阶段的部分
  const phaseHeaders = [
    '## 阶段一：基础架构搭建',
    '## 阶段二：监听系统实现',
    '## 阶段三：交易分析与执行',
    '## 阶段四：策略优化与风控'
  ];

  const targetPhaseHeader = phaseHeaders[phase - 1];
  if (!content.includes(targetPhaseHeader)) {
    console.error(`找不到${targetPhaseHeader}部分`);
    process.exit(1);
  }

  // 找到阶段部分的核心成果子部分
  const coreAchievementHeader = '### 核心成果：';
  
  // 查找目标阶段在文件中的位置
  const phaseStartIndex = content.indexOf(targetPhaseHeader);
  const nextPhaseIndex = phase < 4 
    ? content.indexOf(phaseHeaders[phase]) 
    : content.indexOf('## 技术债务与优化方向');
  
  // 提取当前阶段的内容
  const phaseContent = content.substring(phaseStartIndex, nextPhaseIndex);
  
  // 查找核心成果部分
  if (phaseContent.includes(coreAchievementHeader)) {
    // 有核心成果部分，添加新条目
    const achievementSection = phaseContent.substring(
      phaseContent.indexOf(coreAchievementHeader) + coreAchievementHeader.length
    );
    
    // 只在"计划中"阶段将待完成项转为已完成项
    if (phaseContent.includes('（规划中）')) {
      // 查找第一个未完成项 "- [ ]"
      if (achievementSection.includes('- [ ]')) {
        const newContent = content.replace(
          `- [ ] ${newAchievement}`,
          `- ✅ ${newAchievement}`
        );
        fs.writeFileSync(MILESTONE_FILE, newContent, 'utf8');
        console.log(`已将"${newAchievement}"标记为已完成`);
        return;
      }
    }
    
    // 如果不是将规划项改为已完成，则添加新条目
    const beforeAchievement = content.substring(0, phaseStartIndex + phaseContent.indexOf(coreAchievementHeader) + coreAchievementHeader.length);
    const afterAchievement = content.substring(phaseStartIndex + phaseContent.indexOf(coreAchievementHeader) + coreAchievementHeader.length);
    
    const newContent = `${beforeAchievement}
- ✅ ${newAchievement}${afterAchievement}`;
    
    fs.writeFileSync(MILESTONE_FILE, newContent, 'utf8');
    console.log(`已添加新成果: "${newAchievement}"`);
  } else {
    console.error(`在阶段${phase}中找不到核心成果部分`);
    process.exit(1);
  }
}

/**
 * 更新阶段状态
 * @param {number} phase - 阶段编号 (1-4)
 * @param {string} status - 状态 ('进行中', '已完成', '规划中')
 */
function updatePhaseStatus(phase, status) {
  // 读取现有文件
  let content;
  try {
    content = fs.readFileSync(MILESTONE_FILE, 'utf8');
  } catch (err) {
    console.error('无法读取里程碑文件:', err.message);
    process.exit(1);
  }

  // 验证阶段编号
  if (phase < 1 || phase > 4) {
    console.error('阶段编号必须在1-4之间');
    process.exit(1);
  }

  // 验证状态
  const validStatus = ['已完成', '进行中', '规划中'];
  if (!validStatus.includes(status)) {
    console.error(`无效的状态，必须是以下之一: ${validStatus.join(', ')}`);
    process.exit(1);
  }

  // 查找对应阶段的部分
  const phaseHeaders = [
    '## 阶段一：基础架构搭建',
    '## 阶段二：监听系统实现',
    '## 阶段三：交易分析与执行',
    '## 阶段四：策略优化与风控'
  ];

  // 更新状态
  const targetPhaseHeader = phaseHeaders[phase - 1];
  let updatedContent = content;
  
  for (const validStatus of ['已完成', '进行中', '规划中']) {
    const pattern = new RegExp(`${targetPhaseHeader}\\（${validStatus}\\）`, 'g');
    if (pattern.test(content)) {
      updatedContent = updatedContent.replace(
        `${targetPhaseHeader}（${validStatus}）`,
        `${targetPhaseHeader}（${status}）`
      );
      break;
    }
  }
  
  if (updatedContent !== content) {
    fs.writeFileSync(MILESTONE_FILE, updatedContent, 'utf8');
    console.log(`已将阶段${phase}的状态更新为"${status}"`);
  } else {
    console.error(`无法找到或更新阶段${phase}的状态`);
  }
}

/**
 * 添加技术亮点
 * @param {string} highlight - 新的技术亮点
 * @param {number} phase - 阶段编号 (1-4)
 */
function addTechnicalHighlight(highlight, phase) {
  // 读取现有文件
  let content;
  try {
    content = fs.readFileSync(MILESTONE_FILE, 'utf8');
  } catch (err) {
    console.error('无法读取里程碑文件:', err.message);
    process.exit(1);
  }

  // 验证阶段编号
  if (phase < 1 || phase > 4) {
    console.error('阶段编号必须在1-4之间');
    process.exit(1);
  }

  // 查找对应阶段的部分
  const phaseHeaders = [
    '## 阶段一：基础架构搭建',
    '## 阶段二：监听系统实现',
    '## 阶段三：交易分析与执行',
    '## 阶段四：策略优化与风控'
  ];

  const targetPhaseHeader = phaseHeaders[phase - 1];
  if (!content.includes(targetPhaseHeader)) {
    console.error(`找不到${targetPhaseHeader}部分`);
    process.exit(1);
  }

  // 找到阶段部分的技术亮点子部分
  const highlightHeader = '### 技术亮点：';
  
  // 查找目标阶段在文件中的位置
  const phaseStartIndex = content.indexOf(targetPhaseHeader);
  const nextPhaseIndex = phase < 4 
    ? content.indexOf(phaseHeaders[phase]) 
    : content.indexOf('## 技术债务与优化方向');
  
  // 提取当前阶段的内容
  const phaseContent = content.substring(phaseStartIndex, nextPhaseIndex);
  
  // 查找技术亮点部分
  if (phaseContent.includes(highlightHeader)) {
    // 有技术亮点部分，添加新条目
    const beforeHighlight = content.substring(0, phaseStartIndex + phaseContent.indexOf(highlightHeader) + highlightHeader.length);
    const afterHighlight = content.substring(phaseStartIndex + phaseContent.indexOf(highlightHeader) + highlightHeader.length);
    
    const newContent = `${beforeHighlight}
- ${highlight}${afterHighlight}`;
    
    fs.writeFileSync(MILESTONE_FILE, newContent, 'utf8');
    console.log(`已添加新技术亮点: "${highlight}"`);
  } else {
    console.error(`在阶段${phase}中找不到技术亮点部分`);
    process.exit(1);
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
里程碑更新助手

用法:
  添加新成果:
    node scripts/update_milestone.js add-achievement "新成果描述" <阶段编号>
    
  更新阶段状态:
    node scripts/update_milestone.js update-status <阶段编号> <状态>
    
  添加技术亮点:
    node scripts/update_milestone.js add-highlight "技术亮点描述" <阶段编号>

示例:
  node scripts/update_milestone.js add-achievement "完成交易构建模块" 3
  node scripts/update_milestone.js update-status 2 "已完成"
  node scripts/update_milestone.js add-highlight "实现了异步并行处理机制" 2
    `);
    process.exit(0);
  }

  const command = args[0];
  
  switch (command) {
    case 'add-achievement':
      if (args.length !== 3) {
        console.error('添加成果需要2个参数: 成果描述和阶段编号');
        process.exit(1);
      }
      updateMilestone(args[1], Number.parseInt(args[2], 10));
      break;
      
    case 'update-status':
      if (args.length !== 3) {
        console.error('更新状态需要2个参数: 阶段编号和状态');
        process.exit(1);
      }
      updatePhaseStatus(Number.parseInt(args[1], 10), args[2]);
      break;
      
    case 'add-highlight':
      if (args.length !== 3) {
        console.error('添加技术亮点需要2个参数: 亮点描述和阶段编号');
        process.exit(1);
      }
      addTechnicalHighlight(args[1], Number.parseInt(args[2], 10));
      break;
      
    default:
      console.error(`未知命令: ${command}`);
      process.exit(1);
  }
}

main(); 