-- 迁移现有授权码（保留已用状态）
INSERT OR REPLACE INTO codes (code, plan, days, max_acts, acts, used_by, used_at, created_at) VALUES
('KZ3C3BXR','permanent',NULL,1,1,'["u1790472753318"]',1790472801835,1790472271971),
('BK6LFK4F','permanent',NULL,1,0,'[]',NULL,1790472271972),
('2YXYHV4G','permanent',NULL,1,0,'[]',NULL,1790472271972),
('QTMTMUS9','permanent',NULL,1,0,'[]',NULL,1790472271972),
('V5NESZK3','permanent',NULL,1,0,'[]',NULL,1790472271972),
('DYXTQ3Q8','annual',365,1,0,'[]',NULL,1790472272403),
('7YWQP2NB','annual',365,1,0,'[]',NULL,1790472272403),
('EFUE8CZP','annual',365,1,0,'[]',NULL,1790472272403);