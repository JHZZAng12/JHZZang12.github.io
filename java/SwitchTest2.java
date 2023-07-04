package day02;
import java.util.Scanner;
public class SwitchTest2 {

	public static void main(String[] args) {
		// TODO Auto-generated method stub

	Scanner scanner = new Scanner(System.in) ; 
	int menu ;
	int liter= 0, water , sum = 0 ;
	float ssum = 0;
	System.out.println("choose menu 1 ~ 3  ");
	System.out.println("1. home (liter dang 50won)\n");
	System.out.println("2. store (liter dang 45won)\n");
	System.out.println("3. engs (liter dang 30won)\n");
	menu = scanner.nextInt();
	
	switch(menu) {
	case 1 :
		liter  = 50;
		break;
	case 2 :
		liter = 45;
		break;
	case 3 : 
		liter = 30;
		break;
	
	}
	
	
	System.out.println("press your what liter :");
	water = scanner.nextInt();
	sum = liter * water ;

	

	
	
	
	System.out.printf("menu = %d water = %d sum = %d \n ",menu, water, sum );
	
	ssum = sum + ((sum/100)*5);
	
	System.out.printf("money : %f", ssum);
	
	
	
	
	
	}

}
