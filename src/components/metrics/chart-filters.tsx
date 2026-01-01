"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Filter, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChartFiltersProps {
  onFiltersChange: (filters: {
    accountId: string | null;
    types: string[];
    startDate: Date | undefined;
    endDate: Date | undefined;
  }) => void;
}

export function ChartFilters({ onFiltersChange }: ChartFiltersProps) {
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // Default to last month
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const [startDate, setStartDate] = useState<Date | undefined>(oneMonthAgo);
  const [endDate, setEndDate] = useState<Date | undefined>(today);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [accountsRes, typesRes] = await Promise.all([
          fetch("/api/accounts"),
          fetch("/api/types"),
        ]);

        const [accountsData, typesData] = await Promise.all([
          accountsRes.json(),
          typesRes.json(),
        ]);

        if (accountsData.success) {
          setAvailableAccounts(accountsData.data);
        }
        if (typesData.success) {
          setAvailableTypes(typesData.data);
        }
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const handleSelectAccount = (accountId: string) => {
    setSelectedAccount(accountId === "all" ? null : accountId);
  };

  const handleAddType = (type: string) => {
    if (!selectedTypes.includes(type)) {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleRemoveType = (type: string) => {
    setSelectedTypes(selectedTypes.filter((t) => t !== type));
  };

  const handleApplyFilters = () => {
    onFiltersChange({
      accountId: selectedAccount,
      types: selectedTypes,
      startDate,
      endDate,
    });
  };

  const handleClearFilters = () => {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    setSelectedAccount(null);
    setSelectedTypes([]);
    setStartDate(oneMonthAgo);
    setEndDate(today);
    onFiltersChange({
      accountId: null,
      types: [],
      startDate: oneMonthAgo,
      endDate: today,
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="h-5 w-5" />
          <span>Chart Filters</span>
        </CardTitle>
        <CardDescription>
          Select account IDs and measurement types to visualize
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Account ID</Label>
          <Select
            onValueChange={handleSelectAccount}
            value={selectedAccount || "all"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts (Average)</SelectItem>
              {availableAccounts.map((account) => (
                <SelectItem key={account} value={account}>
                  {account}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {selectedAccount ? `Showing: ${selectedAccount}` : "Showing: Average of all accounts"}
          </p>
        </div>

        <div className="space-y-3">
          <Label>Date Range</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm text-muted-foreground">From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PP") : <span>Start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm text-muted-foreground">To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="end-date"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PP") : <span>End date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Measurement Types</Label>
          <Select
            onValueChange={handleAddType}
            value=""
          >
            <SelectTrigger>
              <SelectValue placeholder="Add type..." />
            </SelectTrigger>
            <SelectContent>
              {availableTypes
                .filter((type) => !selectedTypes.includes(type))
                .map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            {selectedTypes.map((type) => (
              <Badge key={type} variant="secondary">
                {type}
                <button
                  onClick={() => handleRemoveType(type)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedTypes.length === 0 && (
              <p className="text-sm text-muted-foreground">No types selected</p>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          <Button onClick={handleApplyFilters} className="flex-1">
            Apply Filters
          </Button>
          <Button
            onClick={handleClearFilters}
            variant="outline"
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
