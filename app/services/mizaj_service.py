# app/services/mizaj_service.py

class MizajService:
    # ============================================
    # 1. Mojahedi 10-Question Questionnaire (MMQ)
    # ============================================
    @staticmethod
    def calculate_from_mmq(answers: dict):
        """
        answers: dict with keys 'q1' to 'q10', each value 1, 2, or 3
        Q1-Q8: Hot/Cold, Q9-Q10: Wet/Dry
        """
        hot_cold_scores = [answers.get(f'q{i}', 2) for i in range(1, 9)]
        total_hot_cold = sum(hot_cold_scores)

        wet_dry_scores = [answers.get(f'q{i}', 2) for i in range(9, 11)]
        total_wet_dry = sum(wet_dry_scores)

        if total_hot_cold <= 14:
            temp_status = "سرد"
        elif total_hot_cold >= 19:
            temp_status = "گرم"
        else:
            temp_status = "معتدل"

        if total_wet_dry <= 3:
            humidity_status = "تر"
        elif total_wet_dry >= 5:
            humidity_status = "خشک"
        else:
            humidity_status = "معتدل"

        final_mizaj = f"{temp_status} و {humidity_status}"
        recommendations = MizajService._get_recommendations(temp_status, humidity_status)
        description = MizajService._get_description(temp_status, humidity_status)

        return {
            "questionnaire": "MMQ (10 سوالی مجاهد)",
            "scores": {"hot_cold": total_hot_cold, "wet_dry": total_wet_dry},
            "temperament": final_mizaj,
            "temp_status": temp_status,
            "humidity_status": humidity_status,
            "description": description,
            "recommendations": recommendations
        }

    # ============================================
    # 2. Salmannezhad 20-Question Questionnaire (SMQ)
    # ============================================
    @staticmethod
    def calculate_from_smq(answers: dict):
        """
        answers: dict with keys 'q1' to 'q20', each value 1-5
        Q1-Q15: Hot/Cold, Q16-Q20: Wet/Dry
        """
        hot_cold_scores = [answers.get(f'q{i}', 3) for i in range(1, 16)]
        total_hot_cold = sum(hot_cold_scores)

        wet_dry_scores = [answers.get(f'q{i}', 3) for i in range(16, 21)]
        total_wet_dry = sum(wet_dry_scores)

        if total_hot_cold <= 46:
            temp_status = "سرد"
        elif total_hot_cold >= 50:
            temp_status = "گرم"
        else:
            temp_status = "معتدل"

        if total_wet_dry <= 14:
            humidity_status = "تر"
        elif total_wet_dry >= 17:
            humidity_status = "خشک"
        else:
            humidity_status = "معتدل"

        final_mizaj = f"{temp_status} و {humidity_status}"
        recommendations = MizajService._get_recommendations(temp_status, humidity_status)
        description = MizajService._get_description(temp_status, humidity_status)

        return {
            "questionnaire": "SMQ (20 سوالی سلمان\u200cنژاد)",
            "scores": {"hot_cold": total_hot_cold, "wet_dry": total_wet_dry},
            "temperament": final_mizaj,
            "temp_status": temp_status,
            "humidity_status": humidity_status,
            "description": description,
            "recommendations": recommendations
        }

    # ============================================
    # Helper Methods (Shared)
    # ============================================
    @staticmethod
    def _get_recommendations(temp, humid):
        recs = []
        if temp == "سرد":
            recs.extend([
                "مصرف غذاهای گرم مانند عسل، دارچین، زنجبیل و خرما",
                "پوشیدن لباس گرم و استفاده از حمام گرم",
                "نوشیدن دمنوش\u200cهای گرم مانند آویشن و بابونه"
            ])
        elif temp == "گرم":
            recs.extend([
                "مصرف غذاهای خنک مانند ماست، خیار، دوغ و کاهو",
                "استفاده از سایه و محیط خنک",
                "مصرف میوه\u200cهای آبدار مانند هندوانه و خربزه"
            ])
        else:
            recs.append("مزاج معتدل دارید، رژیم متعادل و متنوع داشته باشید")

        if humid == "تر":
            recs.append("مصرف غذاهای خشک مانند نان برشته، عدس و سیب")
        elif humid == "خشک":
            recs.append("مصرف غذاهای تر مانند سوپ، آش و خورشت\u200cهای آبدار")
        else:
            recs.append("تعادل رطوبتی خوبی دارید، همین روال را حفظ کنید")

        return recs

    @staticmethod
    def _get_description(temp, humid):
        base = f"مزاج شما {temp} و {humid} است. "
        if temp == "سرد" and humid == "تر":
            base += "بدنتان به سمت سردی و رطوبت تمایل دارد. نیاز به گرم\u200cکردن و خشک\u200cکردن دارید."
        elif temp == "گرم" and humid == "خشک":
            base += "بدنتان به سمت گرمی و خشکی تمایل دارد. نیاز به خنک\u200cکردن و مرطوب\u200cکردن دارید."
        elif temp == "سرد" and humid == "خشک":
            base += "بدنتان به سمت سردی و خشکی تمایل دارد. نیاز به گرم\u200cکردن و مرطوب\u200cکردن دارید."
        elif temp == "گرم" and humid == "تر":
            base += "بدنتان به سمت گرمی و رطوبت تمایل دارد. نیاز به خنک\u200cکردن و خشک\u200cکردن دارید."
        else:
            base += "بدنتان در حالت تعادل نسبی قرار دارد."
        return base
