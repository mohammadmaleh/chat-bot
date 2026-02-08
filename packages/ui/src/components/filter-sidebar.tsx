'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Input } from './input'
import { Badge } from './badge'
import { Checkbox } from './checkbox'
import { Label } from './label'
import { Slider } from './slider'
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../lib/utils'

interface FilterSection {
  id: string
  label: string
  type: 'checkbox' | 'range' | 'radio'
  options?: Array<{ value: string; label: string; count?: number }>
  min?: number
  max?: number
  value?: any
}

interface FilterSidebarProps {
  sections: FilterSection[]
  activeFilters: Record<string, any>
  onFilterChange: (filterId: string, value: any) => void
  onClearAll: () => void
  onApply?: () => void
  className?: string
  collapsible?: boolean
}

export function FilterSidebar({
  sections,
  activeFilters,
  onFilterChange,
  onClearAll,
  onApply,
  className,
  collapsible = true,
}: FilterSidebarProps) {
  const [collapsedSections, setCollapsedSections] = React.useState<Set<string>>(new Set())

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  const activeFilterCount = Object.values(activeFilters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === 'object') return Object.keys(v).length > 0
    return v !== null && v !== undefined
  }).length

  const handleCheckboxChange = (sectionId: string, optionValue: string, checked: boolean) => {
    const currentValues = activeFilters[sectionId] || []
    const newValues = checked
      ? [...currentValues, optionValue]
      : currentValues.filter((v: string) => v !== optionValue)
    onFilterChange(sectionId, newValues)
  }

  const handleRangeChange = (sectionId: string, values: number[]) => {
    onFilterChange(sectionId, { min: values[0], max: values[1] })
  }

  return (
    <Card className={cn('sticky top-4', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <CardTitle>Filters</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount}</Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-auto p-1 text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {sections.map((section) => {
          const isCollapsed = collapsedSections.has(section.id)
          const sectionValue = activeFilters[section.id]
          const hasActiveFilters =
            Array.isArray(sectionValue)
              ? sectionValue.length > 0
              : sectionValue !== null && sectionValue !== undefined

          return (
            <div key={section.id} className="space-y-3">
              {/* Section Header */}
              <div
                className={cn(
                  'flex items-center justify-between',
                  collapsible && 'cursor-pointer'
                )}
                onClick={() => collapsible && toggleSection(section.id)}
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm">{section.label}</h3>
                  {hasActiveFilters && <Badge variant="secondary" className="text-xs">✓</Badge>}
                </div>
                {collapsible &&
                  (isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ))}
              </div>

              {/* Section Content */}
              {!isCollapsed && (
                <div className="space-y-2">
                  {/* Checkbox Type */}
                  {section.type === 'checkbox' && section.options && (
                    <div className="space-y-2">
                      {section.options.map((option) => {
                        const isChecked = (activeFilters[section.id] || []).includes(
                          option.value
                        )
                        return (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${section.id}-${option.value}`}
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                handleCheckboxChange(section.id, option.value, checked as boolean)
                              }
                            />
                            <Label
                              htmlFor={`${section.id}-${option.value}`}
                              className="flex-1 text-sm font-normal cursor-pointer flex items-center justify-between"
                            >
                              <span>{option.label}</span>
                              {option.count !== undefined && (
                                <span className="text-xs text-muted-foreground">
                                  ({option.count})
                                </span>
                              )}
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Range Type */}
                  {section.type === 'range' && section.min !== undefined && section.max !== undefined && (
                    <div className="space-y-4">
                      <Slider
                        min={section.min}
                        max={section.max}
                        step={1}
                        value={[
                          activeFilters[section.id]?.min || section.min,
                          activeFilters[section.id]?.max || section.max,
                        ]}
                        onValueChange={(values) => handleRangeChange(section.id, values)}
                        className="py-4"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={activeFilters[section.id]?.min || section.min}
                          onChange={(e) =>
                            handleRangeChange(section.id, [
                              Number(e.target.value),
                              activeFilters[section.id]?.max || section.max,
                            ])
                          }
                          className="h-8 text-sm"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          type="number"
                          value={activeFilters[section.id]?.max || section.max}
                          onChange={(e) =>
                            handleRangeChange(section.id, [
                              activeFilters[section.id]?.min || section.min,
                              Number(e.target.value),
                            ])
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Radio Type */}
                  {section.type === 'radio' && section.options && (
                    <div className="space-y-2">
                      {section.options.map((option) => {
                        const isSelected = activeFilters[section.id] === option.value
                        return (
                          <div
                            key={option.value}
                            className={cn(
                              'flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-muted',
                              isSelected && 'bg-primary/10'
                            )}
                            onClick={() => onFilterChange(section.id, option.value)}
                          >
                            <div
                              className={cn(
                                'w-4 h-4 rounded-full border-2',
                                isSelected
                                  ? 'border-primary bg-primary'
                                  : 'border-muted-foreground'
                              )}
                            >
                              {isSelected && (
                                <div className="w-full h-full rounded-full bg-white scale-50" />
                              )}
                            </div>
                            <Label className="flex-1 text-sm font-normal cursor-pointer">
                              {option.label}
                            </Label>
                            {option.count !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                ({option.count})
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Divider */}
              {sections.indexOf(section) < sections.length - 1 && (
                <div className="border-t" />
              )}
            </div>
          )
        })}

        {/* Apply Button */}
        {onApply && (
          <Button onClick={onApply} className="w-full mt-6">
            Apply Filters
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
