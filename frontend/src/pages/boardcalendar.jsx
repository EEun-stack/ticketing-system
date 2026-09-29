import { useEffect, useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { adminFetch } from "../api/adminApi";
import "../styles/boardcalendar.css";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function BoardCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const todayKey = getDateKey(new Date());
    const monthLabel = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    useEffect(() => {
        let isCancelled = false;
        const timeout = window.setTimeout(() => {
            adminFetch("/api/admin/board-room-bookings")
                .then((nextBookings) => {
                    if (!isCancelled) {
                        setBookings(nextBookings.filter(({ status }) => status === "PENDING" || status === "APPROVED"));
                        setErrorMessage("");
                    }
                })
                .catch((error) => {
                    if (!isCancelled) setErrorMessage(error.message);
                })
                .finally(() => {
                    if (!isCancelled) setIsLoading(false);
                });
        }, 3000);

        return () => {
            isCancelled = true;
            window.clearTimeout(timeout);
        };
    }, []);

    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPreviousMonth = new Date(year, month, 0).getDate();
        const days = [];

        for (let index = firstDay - 1; index >= 0; index -= 1) {
            const date = new Date(year, month - 1, daysInPreviousMonth - index);
            days.push({ date, isOutsideMonth: true });
        }
        for (let day = 1; day <= daysInMonth; day += 1) {
            days.push({ date: new Date(year, month, day), isOutsideMonth: false });
        }
        for (let day = 1; days.length < 42; day += 1) {
            days.push({ date: new Date(year, month + 1, day), isOutsideMonth: true });
        }

        return days;
    }, [currentDate]);

    const schedule = useMemo(() => {
        return bookings.reduce((events, booking) => {
            const dateKey = String(booking.date).slice(0, 10);
            if (!events[dateKey]) events[dateKey] = [];
            events[dateKey].push({
                label: booking.purpose,
                time: `${booking.startTime}${booking.endTime ? ` - ${booking.endTime}` : ""}`,
                tone: booking.status === "APPROVED" ? "green" : "gold",
            });
            return events;
        }, {});
    }, [bookings]);

    function changeMonth(offset) {
        setCurrentDate((date) => new Date(date.getFullYear(), date.getMonth() + offset, 1));
    }

    function goToToday() {
        setCurrentDate(new Date());
    }

    return (
        <section className="board-calendar" aria-labelledby="board-calendar-title">
            <div className="calendar-heading">
                <div>
                    <p className="home-eyebrow">Planning desk</p>
                    <h1 id="board-calendar-title">Board calendar</h1>
                    <p className="calendar-subtitle">Keep the team aligned on reviews, meetings, and operational milestones.</p>
                </div>
                <div className="calendar-legend" aria-label="Schedule legend">
                    <span><i className="legend-dot green" />Approved</span>
                    <span><i className="legend-dot gold" />Pending</span>
                </div>
            </div>

            <div className="calendar-toolbar">
                <div className="calendar-toolbar-nav">
                    <button className="calendar-icon-button" type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" title="Previous month">
                        <FaChevronLeft aria-hidden="true" />
                    </button>
                    <button className="calendar-today-button" type="button" onClick={goToToday}>Today</button>
                    <button className="calendar-icon-button" type="button" onClick={() => changeMonth(1)} aria-label="Next month" title="Next month">
                        <FaChevronRight aria-hidden="true" />
                    </button>
                </div>
                <h2>{monthLabel}</h2>
                <span className="calendar-timezone">Local time</span>
            </div>

            <div className="calendar-shell">
                {isLoading && <p className="loading-indicator" aria-live="polite">Loading board calendar...</p>}
                {!isLoading && errorMessage && <p className="calendar-message error-message">{errorMessage}</p>}
                {!isLoading && !errorMessage && bookings.length === 0 && <p className="calendar-message">No board room bookings scheduled.</p>}
                <div className="calendar-weekdays" aria-hidden="true">
                    {weekdays.map((weekday) => <div key={weekday}>{weekday}</div>)}
                </div>
                <div className="calendar-grid">
                    {calendarDays.map(({ date, isOutsideMonth }) => {
                        const dateKey = getDateKey(date);
                        const event = schedule[dateKey];
                        const isToday = dateKey === todayKey;
                        return (
                            <div className={`calendar-day ${isOutsideMonth ? "outside-month" : ""} ${isToday ? "today" : ""}`} key={dateKey}>
                                <span className="calendar-date" aria-label={date.toLocaleDateString("en-US", { dateStyle: "full" })}>{date.getDate()}</span>
                                {isToday && <span className="today-label">Today</span>}
                                {event?.map((item, index) => (
                                    <div className={`calendar-event ${item.tone}`} key={`${dateKey}-${item.time}-${index}`}>
                                        <strong>{item.time}</strong>
                                        <span>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default BoardCalendar;