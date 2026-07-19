import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  XIcon,
  CheckCircleIcon,
  CreditCardIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  LocationMarkerIcon,
  ExclamationIcon,
} from "@heroicons/react/outline";
import { schedule, memberships } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";
import TrainerPhoto from "../UI/TrainerPhoto";
import toast from "react-hot-toast";

const BookingModal = ({ lesson, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [userMemberships, setUserMemberships] = useState([]);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMemberships, setLoadingMemberships] = useState(true);
  const [bookingStep, setBookingStep] = useState("select");

  // Получаем дату занятия без времени для сравнения
  const lessonDate = new Date(lesson.date_lesson);
  const lessonDateOnly = new Date(
    lessonDate.getFullYear(),
    lessonDate.getMonth(),
    lessonDate.getDate(),
  );

  useEffect(() => {
    loadUserMemberships();
  }, []);

  const loadUserMemberships = async () => {
    try {
      setLoadingMemberships(true);
      const response = await memberships.getMy();

      // Фильтруем только активные абонементы с остатком занятий
      // И с датой окончания >= даты занятия
      const active = response.data.filter((m) => {
        const expiryDate = new Date(m.end_date);
        const expiryDateOnly = new Date(
          expiryDate.getFullYear(),
          expiryDate.getMonth(),
          expiryDate.getDate(),
        );

        return (
          m.status === "active" &&
          m.remaining_classes > 0 &&
          expiryDateOnly >= lessonDateOnly
        );
      });

      setUserMemberships(active);
    } catch (error) {
      console.error("Ошибка загрузки абонементов:", error);
      toast.error("Не удалось загрузить абонементы");
    } finally {
      setLoadingMemberships(false);
    }
  };

  const handleSelectMembership = (membershipId) => {
    setSelectedMembership(membershipId);
    setBookingStep("confirm");
  };

  const handleConfirmBooking = async () => {
    if (!selectedMembership) {
      toast.error("Выберите абонемент");
      return;
    }

    setLoading(true);
    try {
      await schedule.book(lesson.id, selectedMembership);
      setBookingStep("success");
      toast.success("Вы успешно записаны на занятие!");
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error("Ошибка записи:", error);
      toast.error(error.response?.data?.detail || "Не удалось записаться");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setBookingStep("select");
  };

  const selectedMembershipData = userMemberships.find(
    (m) => m.id === selectedMembership,
  );

  const formattedDate = format(lessonDate, "d MMMM yyyy", { locale: ru });
  const formattedTime = format(lessonDate, "HH:mm");
  const formattedDayOfWeek = format(lessonDate, "EEEE", { locale: ru });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Шапка */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {bookingStep === "select" && "Запись на занятие"}
              {bookingStep === "confirm" && "Подтверждение записи"}
              {bookingStep === "success" && "Запись оформлена!"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Контент */}
        <div className="p-6">
          {/* Информация о занятии */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-lg text-primary-800 mb-3">
              {lesson.lesson_type?.name}
            </h3>

            {/* Информация о тренере с фото */}
            <div className="flex items-center mb-3 p-2 bg-white rounded-lg">
              <TrainerPhoto
                trainer={lesson.trainer}
                className="w-10 h-10 rounded-full"
              />
              <div className="ml-3">
                <p className="font-medium text-gray-900">
                  {lesson.trainer?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {lesson.trainer?.specialization}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center text-primary-700">
                <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="capitalize">
                  {formattedDayOfWeek}, {formattedDate}
                </span>
              </div>
              <div className="flex items-center text-primary-700">
                <ClockIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{formattedTime}</span>
              </div>
              <div className="flex items-center text-primary-700">
                <LocationMarkerIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{lesson.gym?.name}</span>
              </div>
            </div>
          </div>

          {/* Шаг 1: Выбор абонемента */}
          {bookingStep === "select" && (
            <>
              <h3 className="font-semibold text-lg mb-3">
                Выберите абонемент:
              </h3>

              {loadingMemberships ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : userMemberships.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCardIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    У вас нет активных абонементов на эту дату
                  </p>
                  <Link
                    to="/memberships"
                    className="btn-primary inline-flex items-center"
                    onClick={onClose}
                  >
                    Купить абонемент
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 mb-6 max-h-80 overflow-y-auto pr-2">
                  {userMemberships.map((membership) => {
                    const expiryDate = new Date(membership.end_date);
                    const expiryDateOnly = new Date(
                      expiryDate.getFullYear(),
                      expiryDate.getMonth(),
                      expiryDate.getDate(),
                    );

                    const daysLeft = Math.ceil(
                      (expiryDate - new Date()) / (1000 * 60 * 60 * 24),
                    );
                    const isExpiringSoon = daysLeft <= 7 && daysLeft >= 0;
                    const isExpired = daysLeft < 0;

                    // Проверяем, что абонемент действует на дату занятия
                    const isValidForLesson = expiryDateOnly >= lessonDateOnly;

                    return (
                      <button
                        key={membership.id}
                        onClick={() => handleSelectMembership(membership.id)}
                        disabled={!isValidForLesson}
                        className={`w-full text-left p-4 border-2 rounded-xl transition-all ${
                          !isValidForLesson
                            ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50"
                            : "hover:border-primary-300 hover:bg-gray-50 cursor-pointer border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-gray-900">
                              {membership.membership_offer?.lesson_type?.name ||
                                "Абонемент"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {membership.membership_offer?.lesson_count?.count}{" "}
                              занятий
                            </p>
                          </div>
                          <span className="text-lg font-bold text-primary-600">
                            {membership.remaining_classes}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            Действует до: {format(expiryDate, "dd.MM.yyyy")}
                          </span>
                          {!isValidForLesson ? (
                            <span className="text-red-500 text-xs font-medium bg-red-50 px-2 py-1 rounded-full">
                              Не действует на эту дату
                            </span>
                          ) : isExpired ? (
                            <span className="text-red-500 text-xs font-medium bg-red-50 px-2 py-1 rounded-full">
                              Истек
                            </span>
                          ) : isExpiringSoon ? (
                            <span className="text-orange-500 text-xs font-medium bg-orange-50 px-2 py-1 rounded-full">
                              {daysLeft} {getDaysWord(daysLeft)}
                            </span>
                          ) : null}
                        </div>

                        {membership.remaining_classes <= 2 &&
                          isValidForLesson &&
                          !isExpired && (
                            <div className="mt-2">
                              <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
                                Осталось {membership.remaining_classes}{" "}
                                {getLessonsWord(membership.remaining_classes)}
                              </span>
                            </div>
                          )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {bookingStep === "confirm" && selectedMembershipData && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-700 mb-2">
                  Выбранный абонемент:
                </h4>
                <p className="font-semibold text-gray-900">
                  {selectedMembershipData.membership_offer?.lesson_type?.name}
                </p>
                <p className="text-sm text-gray-500">
                  Осталось занятий: {selectedMembershipData.remaining_classes}
                </p>
                <p className="text-sm text-gray-500">
                  Действует до:{" "}
                  {format(
                    new Date(selectedMembershipData.end_date),
                    "dd.MM.yyyy",
                  )}
                </p>
              </div>

              <div className="bg-primary-50 rounded-xl p-4">
                <h4 className="font-medium text-primary-700 mb-2">
                  Детали записи:
                </h4>
                <p className="text-sm text-primary-600">
                  После подтверждения с вашего абонемента будет списано 1
                  занятие
                </p>
                <p className="text-sm text-primary-600 mt-2">
                  📅 Занятие: {formattedDate} в {formattedTime}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleBack}
                  className="flex-1 btn-secondary py-3"
                  disabled={loading}
                >
                  Назад
                </button>
                <button
                  onClick={handleConfirmBooking}
                  disabled={loading}
                  className="flex-1 btn-primary py-3 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Запись...
                    </div>
                  ) : (
                    "Подтвердить"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Шаг 3: Успех */}
          {bookingStep === "success" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircleIcon className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Вы записаны!
              </h3>
              <p className="text-gray-600 mb-2">
                {formattedDate} в {formattedTime}
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Тренер: {lesson.trainer?.name}
              </p>
              <p className="text-sm text-gray-500">
                Информация о записи появится в разделе "Мои записи"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Вспомогательные функции
function getDaysWord(days) {
  const lastDigit = days % 10;
  const lastTwoDigits = days % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "дней";
  }
  if (lastDigit === 1) {
    return "день";
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return "дня";
  }
  return "дней";
}

function getLessonsWord(count) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "занятий";
  }
  if (lastDigit === 1) {
    return "занятие";
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return "занятия";
  }
  return "занятий";
}

export default BookingModal;