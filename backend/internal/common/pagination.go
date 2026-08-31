package common

import (
	"math"
	"net/http"
	"strconv"
)

type PaginationParams struct {
	Page      int    `json:"page"`
	Limit     int    `json:"limit"`
	Offset    int    `json:"offset"`
	Search    string `json:"search"`
	SortBy    string `json:"sort_by"`
	SortOrder string `json:"sort_order"`
}

type PaginationMeta struct {
	Page       int  `json:"page"`
	Limit      int  `json:"limit"`
	Total      int  `json:"total"`
	TotalPages int  `json:"total_pages"`
	HasNext    bool `json:"has_next"`
	HasPrev    bool `json:"has_prev"`
}

func ParsePaginationParams(r *http.Request) PaginationParams {
	q := r.URL.Query()

	page, err := strconv.Atoi(q.Get("page"))
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(q.Get("limit"))
	if err != nil || limit < 1 {
		limit = 10
	} else if limit > 100 {
		limit = 100
	}

	offset := (page - 1) * limit
	search := q.Get("search")
	sortBy := q.Get("sort_by")
	sortOrder := q.Get("sort_order")
	if sortOrder != "ASC" && sortOrder != "asc" {
		sortOrder = "DESC"
	}

	return PaginationParams{
		Page:      page,
		Limit:     limit,
		Offset:    offset,
		Search:    search,
		SortBy:    sortBy,
		SortOrder: sortOrder,
	}
}

func BuildPaginationMeta(total, page, limit int) PaginationMeta {
	if limit < 1 {
		limit = 10
	}
	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	if totalPages < 1 {
		totalPages = 1
	}

	return PaginationMeta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
		HasNext:    page < totalPages,
		HasPrev:    page > 1,
	}
}
