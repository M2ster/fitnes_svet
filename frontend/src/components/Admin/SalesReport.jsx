import React, { useState } from "react";
import { admin } from "../../services/api";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  ChartBarIcon,
  DownloadIcon,
  CalendarIcon,
} from "@heroicons/react/outline";
import toast from "react-hot-toast";

const SalesReport = () => {
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().setDate(1)), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Выберите период");
      return;
    }

    setLoading(true);
    try {
      const response = await admin.getSalesReport(startDate, endDate);
      setReport(response.data);
    } catch (error) {
      console.error("Ошибка загрузки отчета:", error);
      toast.error("Не удалось загрузить отчет");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!report) return;

    const headers = [
      "Тип абонемента",
      "Кол-во занятий",
      "Срок (дней)",
      "Цена за шт.",
      "Кол-во продаж",
      "Итого",
    ];
    const rows = report.summary.map((item) => [
      item.type,
      item.lessons,
      item.days,
      item.price_per_item,
      item.count,
      item.total,
    ]);

    // Добавляем итоговую строку
    rows.push(["", "", "", "", "ИТОГО:", report.total_sales]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_report_${startDate}_${endDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr) => {
    return format(new Date(dateStr), "dd MMMM yyyy", { locale: ru });
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <ChartBarIcon className="w-6 h-6 mr-2 text-primary-500" />
          Отчет по продажам
        </h2>
      </div>

      {/* Форма выбора периода */}
      <div className="bg-white border border-[#E8DDD2] shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата начала
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата окончания
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generateReport}
            disabled={loading}
            className="btn-primary flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Загрузка...
              </>
            ) : (
              "Сформировать отчет"
            )}
          </button>
          {report && (
            <button
              onClick={exportToCSV}
              className="btn-secondary flex items-center"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Экспорт в CSV
            </button>
          )}
        </div>
      </div>

      {/* Результат отчета */}
      {report && (
        <div className="bg-white border border-[#E8DDD2] shadow-md overflow-hidden">
          {/* Итоговая информация */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-6 border-b border-[#E8DDD2]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Период</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(report.period.start)} —{" "}
                  {formatDate(report.period.end)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Всего продано абонементов
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {report.total_memberships} шт.
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Общая выручка</p>
                <p className="text-3xl font-bold text-primary-600">
                  {report.total_sales.toLocaleString()} ₽
                </p>
              </div>
            </div>
          </div>

          {/* Таблица */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тип абонемента
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Занятий
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Срок
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Цена за шт.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Продано
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Итого
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.summary.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.lessons}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.days}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.price_per_item.toLocaleString()} ₽
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.count} шт.
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.total.toLocaleString()} ₽
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-4 text-right text-sm font-bold text-gray-900"
                  >
                    ИТОГО:
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    {report.total_memberships} шт.
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-primary-600">
                    {report.total_sales.toLocaleString()} ₽
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesReport;
