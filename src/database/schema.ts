import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
  decimal,
  integer,
  jsonb,
  date,
} from 'drizzle-orm/pg-core';

// -------------------------------------------------------------
// ENUMS
// -------------------------------------------------------------
export const roleEnum = pgEnum('role', ['OWNER', 'MANAGER', 'CASHIER']);
export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'FREE_TRIAL',
  'STARTER',
  'PROFESSIONAL',
  'ENTERPRISE',
]);
export const billingCycleEnum = pgEnum('billing_cycle', ['MONTHLY', 'YEARLY']);
export const subscriptionStatusEnum = pgEnum('status', [
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELLED',
  'EXPIRED',
]);
export const saasInvoiceStatusEnum = pgEnum('saas_invoice_status', ['PAID', 'UNPAID', 'VOID']);
export const stockReasonEnum = pgEnum('stock_reason', [
  'RECEIVE_STOCK',
  'SALE',
  'REFUND',
  'DAMAGE',
  'ADJUSTMENT',
  'TRANSFER',
]);
export const eInvoiceStatusEnum = pgEnum('e_invoice_status', ['PENDING', 'SUBMITTED', 'REJECTED']);
export const transactionTypeEnum = pgEnum('transaction_type', ['SALE', 'REFUND']);
export const transactionStatusEnum = pgEnum('transaction_status', ['COMPLETED', 'VOIDED', 'REFUNDED']);
export const discountTypeEnum = pgEnum('discount_type', ['PERCENTAGE', 'FIXED_AMOUNT']);
export const paymentMethodEnum = pgEnum('payment_method', ['CASH', 'CARD', 'LOYALTY', 'OTHER']);

// -------------------------------------------------------------
// 1. IDENTITY & TENANTS
// -------------------------------------------------------------
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  firebaseUid: varchar('firebase_uid', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phoneNumber: varchar('phone_number', { length: 50 }),
  fullName: varchar('full_name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  countryCode: varchar('country_code', { length: 10 }),
  notificationEnabled: boolean('notification_enabled').default(true),
  isSuperAdmin: boolean('is_super_admin').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const businesses = pgTable('businesses', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerUserId: uuid('owner_user_id')
    .notNull()
    .references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  subscriptionTier: subscriptionTierEnum('subscription_tier').default('FREE_TRIAL').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const memberships = pgTable('memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  role: roleEnum('role').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const locations = pgTable('locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  phoneNumber: varchar('phone_number', { length: 50 }),
  isMain: boolean('is_main').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// -------------------------------------------------------------
// 2. SAAS BILLING
// -------------------------------------------------------------
export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  billingCycle: billingCycleEnum('billing_cycle').notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  features: jsonb('features'),
  isRecommended: boolean('is_recommended').default(false),
  freeTrialDays: integer('free_trial_days').default(14),
  isActive: boolean('is_active').default(true).notNull(),
});

export const businessSubscriptions = pgTable('business_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id),
  planId: uuid('plan_id')
    .notNull()
    .references(() => subscriptionPlans.id),
  status: subscriptionStatusEnum('status').notNull(),
  trialStartDate: date('trial_start_date'),
  trialEndDate: date('trial_end_date'),
  currentPeriodStart: date('current_period_start'),
  currentPeriodEnd: date('current_period_end'),
  autoRenew: boolean('auto_renew').default(true),
  cancelledAt: timestamp('cancelled_at'),
});

export const paymentMethodsBilling = pgTable('payment_methods_billing', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id),
  cardHolderName: varchar('card_holder_name', { length: 255 }),
  cardNumberLast4: varchar('card_number_last4', { length: 4 }),
  cardBrand: varchar('card_brand', { length: 50 }),
  expiryMonth: integer('expiry_month'),
  expiryYear: integer('expiry_year'),
  isDefault: boolean('is_default').default(false),
  stripePaymentId: varchar('stripe_payment_id', { length: 255 }),
});

export const saasInvoices = pgTable('saas_invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id),
  subscriptionId: uuid('subscription_id')
    .notNull()
    .references(() => businessSubscriptions.id),
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  status: saasInvoiceStatusEnum('status').notNull(),
  paymentDate: timestamp('payment_date'),
  dueDate: date('due_date'),
  invoicePdfUrl: text('invoice_pdf_url'),
});

// -------------------------------------------------------------
// 3. CATALOG & INVENTORY
// -------------------------------------------------------------
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const units = pgTable('units', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id),
  name: varchar('name', { length: 100 }).notNull(),
  abbreviation: varchar('abbreviation', { length: 20 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id),
  categoryId: uuid('category_id').references(() => categories.id),
  unitId: uuid('unit_id').references(() => units.id),
  name: varchar('name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 100 }),
  barcode: varchar('barcode', { length: 100 }),
  description: text('description'),
  imageUrl: text('image_url'),
  costPrice: decimal('cost_price', { precision: 12, scale: 2 }),
  sellingPrice: decimal('selling_price', { precision: 12, scale: 2 }).notNull(),
  lowStockThreshold: integer('low_stock_threshold').default(5),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const productLocationStock = pgTable('product_location_stock', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  locationId: uuid('location_id')
    .notNull()
    .references(() => locations.id),
  quantityOnHand: decimal('quantity_on_hand', { precision: 12, scale: 3 }).default('0').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productStockBatches = pgTable('product_stock_batches', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  locationId: uuid('location_id')
    .notNull()
    .references(() => locations.id),
  quantityReceived: decimal('quantity_received', { precision: 12, scale: 3 }).notNull(),
  quantityRemaining: decimal('quantity_remaining', { precision: 12, scale: 3 }).notNull(),
  costPrice: decimal('cost_price', { precision: 12, scale: 2 }),
  expiryDate: date('expiry_date'),
  receivedAt: timestamp('received_at').defaultNow().notNull(),
  notes: text('notes'),
});

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  locationId: uuid('location_id')
    .notNull()
    .references(() => locations.id),
  batchId: uuid('batch_id').references(() => productStockBatches.id),
  quantityDelta: decimal('quantity_delta', { precision: 12, scale: 3 }).notNull(),
  reason: stockReasonEnum('reason').notNull(),
  referenceId: uuid('reference_id'),
  actingUserId: uuid('acting_user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// -------------------------------------------------------------
// 4. CUSTOMERS & LOYALTY
// -------------------------------------------------------------
export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id),
  customerNumber: varchar('customer_number', { length: 50 }),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }),
  email: varchar('email', { length: 255 }),
  loyaltyPointsBalance: decimal('loyalty_points_balance', { precision: 12, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const loyaltyTransactions = pgTable('loyalty_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id),
  transactionId: uuid('transaction_id'),
  pointsChange: decimal('points_change', { precision: 12, scale: 2 }).notNull(),
  reason: varchar('reason', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// -------------------------------------------------------------
// 5. TRANSACTIONS & PAYMENTS
// -------------------------------------------------------------
export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id),
  locationId: uuid('location_id')
    .notNull()
    .references(() => locations.id),
  customerId: uuid('customer_id').references(() => customers.id),
  actingUserId: uuid('acting_user_id')
    .notNull()
    .references(() => users.id),
  parentTransactionId: uuid('parent_transaction_id'),
  transactionNumber: varchar('transaction_number', { length: 100 }).notNull(),
  receiptNumber: varchar('receipt_number', { length: 100 }),
  eInvoiceNumber: varchar('e_invoice_number', { length: 100 }),
  eInvoiceStatus: eInvoiceStatusEnum('e_invoice_status'),
  type: transactionTypeEnum('type').default('SALE').notNull(),
  status: transactionStatusEnum('status').default('COMPLETED').notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  discountType: discountTypeEnum('discount_type'),
  discountValue: decimal('discount_value', { precision: 12, scale: 2 }),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).default('0'),
  grandTotal: decimal('grand_total', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  transactionDate: timestamp('transaction_date').defaultNow().notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const transactionPayments = pgTable('transaction_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id')
    .notNull()
    .references(() => transactions.id),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  changeReturned: decimal('change_returned', { precision: 12, scale: 2 }).default('0'),
  reference: varchar('reference', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const transactionItems = pgTable('transaction_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id')
    .notNull()
    .references(() => transactions.id),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  batchId: uuid('batch_id').references(() => productStockBatches.id),
  productNameSnapshot: varchar('product_name_snapshot', { length: 255 }).notNull(),
  skuSnapshot: varchar('sku_snapshot', { length: 100 }),
  costPriceSnapshot: decimal('cost_price_snapshot', { precision: 12, scale: 2 }),
  quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).default('0'),
  lineTotal: decimal('line_total', { precision: 12, scale: 2 }).notNull(),
});
