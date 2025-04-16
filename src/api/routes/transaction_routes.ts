/**
 * 交易API路由
 * 提供交易历史、详情等信息
 */

import express from 'express';
import * as transactionController from '../controllers/transaction_controller';

const router = express.Router();

/**
 * @route   GET /api/transactions
 * @desc    获取交易列表
 */
router.get('/', transactionController.getTransactions);

/**
 * @route   GET /api/transactions/recent
 * @desc    获取最近交易
 */
router.get('/recent', transactionController.getRecentTransactions);

/**
 * @route   GET /api/transactions/:id
 * @desc    获取交易详情
 */
router.get('/:id', transactionController.getTransactionById);

export default router; 