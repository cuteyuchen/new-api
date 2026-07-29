/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

package controller

import (
	"encoding/json"
	"io"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

const (
	modelStatusFilePath = "/data/model-status/status.json"
	modelStatusMaxBytes = 2 << 20
)

// GetModelStatus returns the privacy-safe aggregate written by the external
// health monitor. The path is intentionally fixed so callers cannot read
// arbitrary files from the NewAPI container.
func GetModelStatus(c *gin.Context) {
	file, err := os.Open(modelStatusFilePath)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"success": false,
			"message": "model status is not ready",
		})
		return
	}
	defer file.Close()

	payload, err := io.ReadAll(io.LimitReader(file, modelStatusMaxBytes+1))
	if err != nil || len(payload) > modelStatusMaxBytes || !json.Valid(payload) {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"success": false,
			"message": "model status is temporarily unavailable",
		})
		return
	}

	c.Header("Cache-Control", "no-store, max-age=0")
	c.Data(http.StatusOK, "application/json; charset=utf-8", payload)
}
