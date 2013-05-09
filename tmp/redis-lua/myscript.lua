local key = "test"
local n_total = tonumber(redis.call("HGET", key, "n_total"))
local n_completed = tonumber(redis.call("HINCRBY", key, "n_completed", 1))
return { n_total, n_completed }
