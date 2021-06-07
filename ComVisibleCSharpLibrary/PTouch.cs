using System;
using System.Runtime.InteropServices;


namespace ComVisibleCSharpLibrary
{
    [Guid("B25E0195-B9F9-42F8-B554-83424A2B24D5")]
    public interface AllMethods
    {
        int IsThisIntMethodVisible();
        bool IsThisMethodComVisible();
        string IsThisStringMehtodVisible();
    }


    [ComVisible(true)]
    [ClassInterface(ClassInterfaceType.None)]
    [Guid("16A08691-A17F-4BAE-9D3B-FA5B50F51960")]
    [ProgId("ComVisibleCSharpLibrary.PTouch")]
    public class PTouch : AllMethods
    {
        public PTouch()
        {

        }

        public bool IsThisMethodComVisible()
        {
            return true;
        }

        public string IsThisStringMehtodVisible()
        {
            return "Yes Visible";
        }

        public int IsThisIntMethodVisible()
        {
            return 1;
        }

    }
}
