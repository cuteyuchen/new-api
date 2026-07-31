package controller

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseNewAPIBalanceUsesUpstreamQuotaUnit(t *testing.T) {
	result, err := parseNewAPIBalance(
		[]byte(`{"success":true,"data":{"quota_per_unit":1000000}}`),
		[]byte(`{"success":true,"data":{"quota":2500000,"used_quota":750000}}`),
	)

	require.NoError(t, err)
	assert.Equal(t, 2.5, result.BalanceUSD)
	assert.Equal(t, 0.75, result.UsedUSD)
}

func TestParseSub2APIBalanceUsesRemainingAndTotalActualCost(t *testing.T) {
	result, err := parseSub2APIBalance([]byte(`{
		"balance":9.2,
		"remaining":9.1,
		"usage":{"total":{"actual_cost":0.8}}
	}`))

	require.NoError(t, err)
	assert.Equal(t, 9.1, result.BalanceUSD)
	assert.Equal(t, 0.8, result.UsedUSD)
}

func TestChannelJSONNeverContainsBalanceToken(t *testing.T) {
	channel := model.Channel{BalanceToken: "secret-token", HasBalanceToken: true}
	body, err := common.Marshal(channel)

	require.NoError(t, err)
	assert.NotContains(t, string(body), "secret-token")
	assert.NotContains(t, string(body), `"balance_token":`)
	assert.Contains(t, string(body), `"has_balance_token":true`)
}
